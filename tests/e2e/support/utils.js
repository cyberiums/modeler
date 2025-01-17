import { saveDebounce } from '../../../src/components/inspectors/inspectorConstants';
import path from 'path';

const renderTime = 300;

export function getGraphElements() {
  return cy.window()
    .its('store.state.graph')
    .invoke('getCells')
    .then(cells => cells.filter(cell => cell.component));
}

export function getElementAtPosition(position, componentType) {
  const paperGridSize = 10;
  const searchRectangle = {
    width: paperGridSize,
    height: paperGridSize,
    x: position.x - paperGridSize / 2,
    y: position.y - paperGridSize / 2,
  };

  return cy.window()
    .its('store.state.paper')
    .invoke('findViewsInArea', searchRectangle)
    .then(views => views.filter(view => view.model.component))
    .then(views => {
      return views;
    })
    .then(views => {
      return componentType
        ? views.filter(view => view.model.component.node.type === componentType)
        : views;
    })
    .then(views => views.sort((view1, view2) => {
      /* Sort shape views by z-index descending; the shape "on top" will be first in array. */
      return view2.model.get('z') - view1.model.get('z');
    }))
    .then(views => views[0])
    .then(view => view.$el ? view.$el : null);
}

export function getLinksConnectedToElement($element) {
  return cy.window()
    .its('store.state.graph')
    .invoke('getConnectedLinks', { id: $element.attr('model-id') })
    .then(links => {
      return cy.window().its('store.state.paper').then(paper => {
        return links.map(link => link.findView(paper).$el);
      });
    });
}

export function getComponentsEmbeddedInShape($element) {
  return cy.window()
    .its('store.state.graph')
    .invoke('getCell', $element.attr('model-id'))
    .then(shape => shape.getEmbeddedCells())
    .then(embeddedCells => embeddedCells.filter(cell => cell.component))
    .then(embeddedComponents => {
      return cy.window().its('store.state.paper').then(paper => {
        return embeddedComponents.map(cell => cell.findView(paper).$el);
      });
    });
}

export function dragFromSourceToDest(source, position) {
  cy.window().its('store.state.paper').then(paper => {
    const { tx, ty } = paper.translate();

    cy.get('.main-paper').then($paperContainer => {
      const { x, y } = $paperContainer[0].getBoundingClientRect();
      const mouseEvent = { clientX: position.x + x + tx, clientY: position.y + y + ty };

      cy.get(`[data-test=${source}]`).trigger('mousedown');
      cy.document().trigger('mousemove', mouseEvent);
      cy.document().trigger('mouseup', mouseEvent);
    });
  });

  return waitToRenderAllShapes();
}

export function getPositionInPaperCoords(position) {
  return cy.window().its('store.state.paper').then(paper => {
    const { tx, ty } = paper.translate();

    return cy.get('.main-paper').then($paperContainer => {
      const { x, y } = $paperContainer[0].getBoundingClientRect();
      return { x: position.x + x + tx, y: position.y + y + ty };
    });
  });
}

export function getCrownButtonForElement($element, crownButton) {
  if (hasNewCrownConfig($element)) {
    return cy.get(`#${ crownButton }`);
  }
  return cy
    .get(`#${$element.attr('id')} ~ [data-test=${crownButton}]`)
    .then(crownButtons => crownButtons.filter((index, button) => Cypress.$(button).is(':visible')))
    .then(crownButtons => crownButtons[0]);
}

function hasNewCrownConfig($element) {
  const newCrown = [
    'processmaker.components.nodes.task.Shape',
    'processmaker.components.nodes.boundaryEvent.Shape',
    'processmaker.components.nodes.intermediateEvent.Shape',
    'processmaker.components.nodes.startEvent.Shape',
    'processmaker.components.nodes.endEvent.Shape',
    'processmaker.components.nodes.gateway.Shape',
    'textAnnotation',
  ];
  return newCrown.includes($element.data('type'));
}

export function typeIntoTextInput(selector, value) {
  cy.get(selector).clear().type(value);
  waitToRenderNodeUpdates();
}

export function waitToRenderAllShapes() {
  cy.wait(renderTime);
}

export function waitToRenderNodeUpdates() {
  cy.wait(saveDebounce);
}

export function connectNodesWithFlow(flowType, startPosition, endPosition, clickPosition = 'center') {
  return getElementAtPosition(startPosition)
    .click({ force: true })
    .then($element => {
      return getCrownButtonForElement($element, flowType)
        .click({ force: true });
    })
    .then(() => {
      getElementAtPosition(endPosition).then($endElement => {
        getPositionInPaperCoords(endPosition).then(({ x, y }) => {
          cy.wrap($endElement)
            .trigger('mousemove', { clientX: x, clientY: y, force: true })
            .wait(renderTime)
            .click(clickPosition, { force: true });
        });
      });
    });
}

export function isElementCovered($element) {
  return cy.window()
    .its('store.state.paper')
    .invoke('findViewsInArea', $element[0].getBBox())
    .then(shapeViews => {
      const zIndexes = shapeViews.filter(shapeView => shapeView.model.component)
        .map(shapeView => shapeView.model.get('z'));

      return cy.window()
        .its('store.state.paper')
        .invoke('getModelById', $element.attr('model-id'))
        .then(shape => {
          const shapeZIndex = shape.get('z');

          return zIndexes.some(zIndex => shapeZIndex < zIndex);
        });
    });
}

export function moveElement(elementPosition, x, y, componentType) {
  return cy.window().its('store.state.paper').then(paper => {
    const newPosition = paper.localToPagePoint(x, y);

    return getElementAtPosition(elementPosition, componentType)
      .trigger('mousedown', { which: 1, force: true })
      .trigger('mousemove', { clientX: newPosition.x, clientY: newPosition.y, force: true })
      .trigger('mouseup', { force: true });
  });
}

export function moveElementRelativeTo(elementPosition, x, y, componentType) {
  return cy.window().its('store.state.paper').then(paper => {

    return getElementAtPosition(elementPosition, componentType)
      .then($element => {
        const { left, top } = $element.position();
        const newPosition = paper.localToPagePoint(left + x, top + y);
        cy.wrap($element)
          .trigger('mousedown', 'topLeft', { which: 1, force: true })
          .trigger('mousemove', 'topLeft', { clientX: newPosition.x, clientY: newPosition.y, force: true })
          .trigger('mouseup', 'topLeft', { force: true });
      });
  });
}

export function removeIndentationAndLinebreaks(string) {
  return string.replace(/(^\s+)|(\n)/gim, '');
}

export const modalAnimationTime = 300;

export function uploadXml(filepath) {
  cy.contains('Upload XML').click();

  /* Wait for modal to open */
  cy.wait(modalAnimationTime);

  cy.fixture(filepath, 'base64').then(bpmnProcess => {
    return cy.get('input[type=file]').then($input => {
      return Cypress.Blob.base64StringToBlob(bpmnProcess, 'text/xml')
        .then((blob) => {
          const file = new File([blob], path.basename(filepath), { type: 'text/xml' });
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(file);
          const input = $input[0];
          input.files = dataTransfer.files;
          cy.wrap(input).trigger('change', { force: true });
          return cy.get('#uploadmodal button').contains('Upload').click();
        });
    });
  });

  /* Wait for modal to close */
  cy.wait(modalAnimationTime);
}

export function testNumberOfVertices(numberOfVertices) {
  cy.window()
    .its('store.state')
    .then(state => {
      const { graph, paper } = state;
      const link = graph.getLinks()[0];
      const waypoints = link.findView(paper).getConnection().segments;
      expect(waypoints).to.have.length(numberOfVertices);

      if (Cypress.env('inProcessmaker')) {
        return;
      }

      cy.get('[data-test=downloadXMLBtn]').click();
      cy.window()
        .its('xml')
        .then(removeIndentationAndLinebreaks)
        .then(xml => {
          const waypoints = xml.match(/<di:waypoint x="\d+(?:\.\d+)?" y="\d+(?:\.\d+)?" \/>/gim);

          const numberOfCustomVertices = link.vertices().length;
          const hasCustomVertices = numberOfCustomVertices > 0;
          const numberOfStartAndEndVertices = 2;

          if (hasCustomVertices) {
            expect(waypoints).to.have.length(numberOfStartAndEndVertices + numberOfCustomVertices);
          } else {
            expect(waypoints).to.have.length(numberOfStartAndEndVertices);
          }
        });
    });
}

export function getNumberOfLinks() {
  return cy.window()
    .its('store.state')
    .then(({ graph }) => graph.getLinks().length);
}

export function getXml() {
  cy.get('[data-test=downloadXMLBtn]').click();
  return cy.window()
    .its('xml')
    .then(removeIndentationAndLinebreaks);
}

export function assertDownloadedXmlContainsExpected(xmlString) {
  getXml().then(xml => {
    expect(xml).to.contain(removeIndentationAndLinebreaks(xmlString));
  });
}

export function assertDownloadedXmlDoesNotContainExpected(xmlString) {
  getXml().then(xml => {
    expect(xml).to.not.contain(removeIndentationAndLinebreaks(xmlString));
  });
}

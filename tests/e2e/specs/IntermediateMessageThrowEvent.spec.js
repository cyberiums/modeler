import {
  dragFromSourceToDest,
  getCrownButtonForElement,
  getElementAtPosition,
  removeIndentationAndLinebreaks,
  typeIntoTextInput,
  waitToRenderAllShapes,
} from '../support/utils';

import { nodeTypes } from '../support/constants';

const messageRef = 'node_2_message';
const messageName = 'awesome message name';
const eventXMLSnippet = `<bpmn:intermediateThrowEvent id="node_2" name="Intermediate Message Throw Event"><bpmn:messageEventDefinition messageRef="${ messageRef }" /></bpmn:intermediateThrowEvent>`;
const messageXMLSnippet = `<bpmn:message id="${ messageRef }" name="${ messageName }" />`;
const intermediateMessageThrowEventPosition = { x: 300, y: 200 };

describe('Intermediate Message Throw Event', () => {
  it('can render an intermediate message throw event', function() {
    dragFromSourceToDest(nodeTypes.intermediateMessageThrowEvent, intermediateMessageThrowEventPosition);

    getElementAtPosition(intermediateMessageThrowEventPosition).click();

    cy.get('[data-test=downloadXMLBtn]').click();

    cy.window().its('xml').then(removeIndentationAndLinebreaks).then(xml => {
      expect(xml).to.contain(eventXMLSnippet);
    });
  });

  it('can create a message when intermediate message throw event is dragged on', function() {
    dragFromSourceToDest(nodeTypes.intermediateMessageThrowEvent, intermediateMessageThrowEventPosition);

    getElementAtPosition(intermediateMessageThrowEventPosition).click();

    typeIntoTextInput('[name=messageName]', messageName);

    cy.get('[data-test=downloadXMLBtn]').click();

    cy.window().its('xml').then(removeIndentationAndLinebreaks).then(xml => {
      expect(xml).to.contain(eventXMLSnippet);
      expect(xml).to.contain(messageXMLSnippet);
    });
  });

  it('can remove the message when intermediate message throw event is deleted', function() {
    dragFromSourceToDest(nodeTypes.intermediateMessageThrowEvent, intermediateMessageThrowEventPosition);

    getElementAtPosition(intermediateMessageThrowEventPosition).click();

    typeIntoTextInput('[name=messageName]', messageName);

    cy.get('[data-test=downloadXMLBtn]').click();

    cy.window().its('xml').then(removeIndentationAndLinebreaks).then(xml => {
      expect(xml).to.contain(messageXMLSnippet);
    });

    getElementAtPosition(intermediateMessageThrowEventPosition).click().then($intermediateMessageThrowEvent => {
      getCrownButtonForElement($intermediateMessageThrowEvent, 'delete-button').click();
    });

    cy.get('[data-test=downloadXMLBtn]').click();

    cy.window().its('xml').then(removeIndentationAndLinebreaks).then(xml => {
      expect(xml).to.not.contain(messageXMLSnippet);
    });
  });

  it('retains new message name when clicking off and on intermediate message throw event', function() {
    const startEventPosition = { x: 150, y: 150 };

    dragFromSourceToDest(nodeTypes.intermediateMessageThrowEvent, intermediateMessageThrowEventPosition);

    getElementAtPosition(intermediateMessageThrowEventPosition).click();

    typeIntoTextInput('[name=messageName]', messageName);

    getElementAtPosition(startEventPosition).click();
    waitToRenderAllShapes();
    getElementAtPosition(intermediateMessageThrowEventPosition).click({ force: true });
    cy.get('[name=messageName]').should('have.value', messageName);
  });

  it('can associate and rename message on intermediate message catch event', function() {
    const intermediateMessageCatchEventPosition = { x: 200, y: 300 };
    const catchEventXMLSnippet = `<bpmn:intermediateCatchEvent id="node_3" name="Intermediate Message Catch Event"><bpmn:messageEventDefinition messageRef="${ messageRef }" /></bpmn:intermediateCatchEvent>`;

    dragFromSourceToDest(nodeTypes.intermediateMessageThrowEvent, intermediateMessageThrowEventPosition);
    dragFromSourceToDest(nodeTypes.intermediateMessageCatchEvent, intermediateMessageCatchEventPosition);

    getElementAtPosition(intermediateMessageCatchEventPosition).click();
    cy.get('[name=messageRef]').select(messageRef);

    getElementAtPosition(intermediateMessageThrowEventPosition).click();
    typeIntoTextInput('[name=messageName]', messageName);

    getElementAtPosition(intermediateMessageCatchEventPosition).click();
    cy.get('[name=messageRef]').should('contain', messageName);

    cy.get('[data-test=downloadXMLBtn]').click();

    cy.window().its('xml').then(removeIndentationAndLinebreaks).then(xml => {
      expect(xml).to.contain(eventXMLSnippet);
      expect(xml).to.contain(catchEventXMLSnippet);
      expect(xml).to.contain(messageXMLSnippet);
    });
  });
});

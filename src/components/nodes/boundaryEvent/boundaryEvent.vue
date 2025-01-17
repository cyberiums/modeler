<template>
  <crown-config
    :highlighted="highlighted"
    :paper="paper"
    :graph="graph"
    :shape="shape"
    :node="node"
    :nodeRegistry="nodeRegistry"
    :moddle="moddle"
    :collaboration="collaboration"
    :process-node="processNode"
    :plane-elements="planeElements"
    :is-rendering="isRendering"
    @remove-node="$emit('remove-node', $event)"
    @add-node="$emit('add-node', $event)"
    @save-state="$emit('save-state', $event)"
  />
</template>

<script>
import portsConfig from '@/mixins/portsConfig';
import EventShape from '@/components/nodes/boundaryEvent/shape';
import isValidBoundaryEventTarget from './validBoundaryEventTargets';
import resetShapeColor from '@/components/resetShapeColor';
import { getBoundaryAnchorPoint } from '@/portsUtils';
import { invalidNodeColor } from '@/components/nodeColors';
import hideLabelOnDrag from '@/mixins/hideLabelOnDrag';
import CrownConfig from '@/components/crownConfig';
import highlightConfig from '@/mixins/highlightConfig';

export default {
  components: {
    CrownConfig,
  },
  props: [
    'graph',
    'node',
    'id',
    'highlighted',
    'nodeRegistry',
    'moddle',
    'paper',
    'collaboration',
    'processNode',
    'planeElements',
    'isRendering',
  ],
  mixins: [highlightConfig, portsConfig, hideLabelOnDrag],
  data() {
    return {
      shape: null,
      definition: null,
      previousPosition: null,
      validPosition: null,
      invalidTargetElement: null,
    };
  },
  watch: {
    'node.definition.name'(name) {
      this.shape.attr('label/text', name);
    },
    'node.definition.cancelActivity'(isCancelActivity) {
      this.toggleInterruptingStyle(isCancelActivity);
    },
  },
  methods: {
    getTaskUnderShape() {
      return this.graph
        .findModelsUnderElement(this.shape)
        .find(this.isValidBoundaryEventTarget);
    },
    isValidBoundaryEventTarget(model) {
      return isValidBoundaryEventTarget(model.component);
    },
    setShapeBorderDashSpacing(dashLength) {
      this.shape.attr({
        body: {
          strokeDasharray: dashLength,
        },
        body2: {
          strokeDasharray: dashLength,
        },
      });
    },
    setSolidShapeBorder() {
      const solidLineSpacing = 0;
      this.setShapeBorderDashSpacing(solidLineSpacing);
    },
    setDashedShapeBorder() {
      const dashedLineSpacing = 5;
      this.setShapeBorderDashSpacing(dashedLineSpacing);
    },
    toggleInterruptingStyle() {
      this.node.definition.cancelActivity ? this.setSolidShapeBorder() : this.setDashedShapeBorder();
    },
    setShapeProperties() {
      const { x, y, width, height } = this.node.diagram.bounds;
      this.shape.position(x, y);
      this.shape.resize(width, height);
      this.shape.attr('label/text', this.node.definition.get('name'));
      this.shape.component = this;
    },
    hasPositionChanged() {
      if (!this.previousPosition) {
        return true;
      }
      const { x, y } = this.shape.position();
      const { x: prevX, y: prevY } = this.previousPosition;

      return x !== prevX || y !== prevY;
    },
    getCenterPosition() {
      const { x, y } = this.shape.position();
      const { width, height } = this.shape.size();

      return {
        x: x + (width / 2),
        y: y + (height / 2),
      };
    },
    updateShapePosition(task) {
      if (!this.hasPositionChanged()) {
        return;
      }

      const { x, y } = getBoundaryAnchorPoint(this.getCenterPosition(), task);
      const { width, height } = this.shape.size();
      this.shape.position(x - (width / 2), y - (height / 2));

      this.previousPosition = this.shape.position();
    },
    attachBoundaryEventToTask(task) {
      if (!task) {
        return;
      }

      const currentlyAttachedTask = this.shape.getParentCell();

      if (currentlyAttachedTask) {
        currentlyAttachedTask.unembed(this.shape);
      }

      task.embed(this.shape);
      this.node.definition.set('attachedToRef', task.component.node.definition);
    },
    resetToInitialPosition() {
      this.shape.position(this.validPosition.x, this.validPosition.y);
      this.allowSetNodePosition = true;
    },
    moveBoundaryEventIfOverTask() {
      const task = this.getTaskUnderShape();

      if (!task) {
        this.resetToInitialPosition();
        return;
      }

      this.attachBoundaryEventToTask(task);
      this.updateShapePosition(task);
    },
    resetInvalidTarget() {
      if (this.invalidTargetElement) {
        resetShapeColor(this.invalidTargetElement);
        this.invalidTargetElement = null;
      }
    },
    attachToValidTarget(cellView) {
      if (cellView.model !== this.shape) {
        return;
      }

      this.allowSetNodePosition = false;
      this.validPosition = this.shape.position();
      this.shape.listenToOnce(this.paper, 'cell:pointerup blank:pointerup', () => {
        this.moveBoundaryEventIfOverTask();
        this.resetInvalidTarget();
        this.$emit('save-state');
        this.allowSetNodePosition = true;
      });
    },
    turnInvalidTargetRed() {
      if (!this.highlighted) {
        return;
      }

      const targetElement = this.graph
        .findModelsUnderElement(this.shape)
        .filter(model => model.component)[0];

      const targetHasNotChanged = this.invalidTargetElement === targetElement;
      if (targetHasNotChanged) {
        return;
      }

      const targetIsInvalid = targetElement && !this.isValidBoundaryEventTarget(targetElement);
      if (targetIsInvalid) {
        targetElement.attr('body/fill', invalidNodeColor);
      }

      if (this.invalidTargetElement) {
        resetShapeColor(this.invalidTargetElement);
      }

      this.invalidTargetElement = targetElement;
    },
  },
  async mounted() {
    this.shape = new EventShape();
    this.setShapeProperties();
    this.shape.addTo(this.graph);

    await this.$nextTick();

    this.toggleInterruptingStyle();
    const task = this.getTaskUnderShape();
    this.attachBoundaryEventToTask(task);
    this.updateShapePosition(task);

    this.shape.on('change:position', this.turnInvalidTargetRed);
    this.shape.listenTo(this.paper, 'element:pointerdown', this.attachToValidTarget);
  },
};
</script>

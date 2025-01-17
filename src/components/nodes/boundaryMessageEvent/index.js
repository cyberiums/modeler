import component from './boundaryMessageEvent.vue';
import boundaryEventConfig from '../boundaryEvent';
import merge from 'lodash/merge';
import cloneDeep from 'lodash/cloneDeep';
import interruptingToggleConfig from '../boundaryEvent/interruptingToggleInspector';

export const id = 'processmaker-modeler-boundary-message-event';
export default merge(cloneDeep(boundaryEventConfig), {
  id,
  component,
  label: 'Boundary Message Event',
  icon: require('@/assets/toolpanel/intermediate-mail-event.svg'),
  definition(moddle, $t) {
    return moddle.create('bpmn:BoundaryEvent', {
      name: $t('New Boundary Message Event'),
      cancelActivity: true,
      eventDefinitions: [
        moddle.create('bpmn:MessageEventDefinition'),
      ],
    });
  },
  inspectorConfig: [
    {
      items: [
        {
          items: [
            {},
            interruptingToggleConfig,
          ],
        },
      ],
    },
  ],
});

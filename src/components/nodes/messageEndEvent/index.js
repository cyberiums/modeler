import component from './messageEndEvent.vue';
import merge from 'lodash/merge';
import cloneDeep from 'lodash/cloneDeep';
import endEventConfig from '@/components/nodes/endEvent';
import omit from 'lodash/omit';

export default merge(cloneDeep(endEventConfig), {
  id: 'processmaker-modeler-message-end-event',
  component,
  icon: require('@/assets/toolpanel/end-email-event.svg'),
  label: 'Message End Event',
  definition(moddle, $t) {
    return moddle.create('bpmn:EndEvent', {
      name: $t('Message End Event'),
      eventDefinitions: [
        moddle.create('bpmn:MessageEventDefinition'),
      ],
    });
  },
  inspectorData(node) {
    return Object.entries(node.definition).reduce((data, [key, value]) => {
      if (key === 'eventDefinitions') {
        data.messageName = value[0].get('messageRef').name;
      } else {
        data[key] = value;
      }

      return data;
    }, {});
  },
  inspectorHandler(value, node, setNodeProp) {
    for (const key in omit(value, ['$type', 'eventDefinitions', 'messageName'])) {
      if (node.definition[key] === value[key]) {
        continue;
      }

      setNodeProp(node, key, value[key]);
    }

    const message = node.definition.get('eventDefinitions')[0].messageRef;
    if (message.name !== value.messageName) {
      message.name = value.messageName;
    }
  },
  inspectorConfig: [
    {
      items: [
        {
          items: [
            {},
            {
              component: 'FormInput',
              config: {
                label: 'Message Name',
                name: 'messageName',
              },
            },
          ],
        },
      ],
    },
  ],
});

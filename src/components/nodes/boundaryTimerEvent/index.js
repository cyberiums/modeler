import component from './boundaryTimerEvent.vue';
import IntermediateTimer from '../../inspectors/IntermediateTimer.vue';
import boundaryEventConfig from '../boundaryEvent';
import merge from 'lodash/merge';
import cloneDeep from 'lodash/cloneDeep';
import interruptingToggleConfig from '../boundaryEvent/interruptingToggleInspector';
import idConfigSettings from '@/components/inspectors/idConfigSettings';

export const defaultDurationValue = 'PT1H';

export default merge(cloneDeep(boundaryEventConfig), {
  id: 'processmaker-modeler-boundary-timer-event',
  component,
  label: 'Boundary Timer Event',
  icon: require('@/assets/toolpanel/boundary-timer-event.svg'),
  definition(moddle, $t) {
    return moddle.create('bpmn:BoundaryEvent', {
      name: $t('New Boundary Timer Event'),
      cancelActivity: true,
      eventDefinitions: [
        moddle.create('bpmn:TimerEventDefinition', {
          timeDuration: moddle.create('bpmn:Expression', {
            body: defaultDurationValue,
          }),
        }),
      ],
    });
  },
  inspectorData(node) {
    return Object.entries(node.definition).reduce((data, [key, value]) => {
      if (key === 'eventDefinitions') {
        const type = Object.keys(value[0])[1];
        const body = value[0][type].body;
        data[key] = { type, body };
      } else {
        data[key] = value;
      }
      return data;
    }, {});
  },
  inspectorHandler(value, node, setNodeProp, moddle) {
    const definition = node.definition;

    // Go through each property and rebind it to our data
    for (const key in value) {
      if (definition[key] === value[key]) {
        continue;
      }

      if (key === 'eventDefinitions') {
        const { type, body } = value[key];

        const expression = definition.get(key)[0][type];
        if (expression && expression.body === body) {
          continue;
        }

        const eventDefinition = {
          [type]: moddle.create('bpmn:Expression', { body }),
        };

        const eventDefinitions = [
          moddle.create('bpmn:TimerEventDefinition', eventDefinition),
        ];
        setNodeProp(node, 'eventDefinitions', eventDefinitions);
      } else {
        setNodeProp(node, key, value[key]);
      }
    }
  },
  inspectorConfig: [{
    items: [
      {
        items: [
          {},
          interruptingToggleConfig,
        ],
      },
      {
        component: 'FormAccordion',
        container: true,
        config: {
          label: 'Timing Control',
          icon: 'clock',
          name: 'timing-control',
        },
        items: [
          {
            component: IntermediateTimer,
            config: {
              label: 'Name',
              helper: 'Time expression',
              name: 'eventDefinitions',
            },
          },
        ],
      },
      {
        component: 'FormAccordion',
        container: true,
        config: {
          initiallyOpen: false,
          label: 'Advanced',
          icon: 'cogs',
          name: 'advanced',
        },
        items: [
          {
            component: 'FormInput',
            config: idConfigSettings,
          },
        ],
      },
    ],
  }],
});

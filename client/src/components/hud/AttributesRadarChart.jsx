import { useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';

const ATTRIBUTE_CONFIG = {
  Strength: { key: 'strength', color: '#DC2626' }, // crimson
  Intelligence: { key: 'intelligence', color: '#38BDF8' }, // azure
  Vitality: { key: 'vitality', color: '#34D399' }, // emerald
  Willpower: { key: 'willpower', color: '#A78BFA' }, // violet
  Perception: { key: 'perception', color: '#FBBF24' }, // amber
};

/**
 * Custom tick rendering colored axis labels corresponding to attr-* design tokens.
 */
function CustomAngleTick({ payload, x, y }) {
  const config = ATTRIBUTE_CONFIG[payload.value];
  const color = config ? config.color : '#E7E9EE';

  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      dominantBaseline="central"
      fill={color}
      className="font-display text-[10px] sm:text-xs font-semibold select-none"
    >
      {payload.value}
    </text>
  );
}

CustomAngleTick.propTypes = {
  payload: PropTypes.shape({
    value: PropTypes.string.isRequired,
  }),
  x: PropTypes.number,
  y: PropTypes.number,
};

/**
 * 5-Axis Attribute Radar Chart using Recharts.
 * Displays Strength, Intelligence, Vitality, Willpower, Perception.
 *
 * @param {object} props
 * @param {object} props.attributes - Character attributes map
 */
export function AttributesRadarChart({ attributes = {} }) {
  const data = useMemo(
    () => [
      { attribute: 'Strength', value: attributes.strength ?? 5 },
      { attribute: 'Intelligence', value: attributes.intelligence ?? 5 },
      { attribute: 'Vitality', value: attributes.vitality ?? 5 },
      { attribute: 'Willpower', value: attributes.willpower ?? 5 },
      { attribute: 'Perception', value: attributes.perception ?? 5 },
    ],
    [attributes]
  );

  const maxValue = useMemo(() => {
    const vals = data.map((d) => d.value);
    return Math.max(10, Math.ceil(Math.max(...vals) * 1.2));
  }, [data]);

  return (
    <div className="w-full h-64 sm:h-72 flex items-center justify-center relative">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="rgba(255, 255, 255, 0.08)" />
          <PolarAngleAxis
            dataKey="attribute"
            tick={(props) => <CustomAngleTick {...props} />}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, maxValue]}
            tick={false}
            axisLine={false}
          />
          <Radar
            name="Attributes"
            dataKey="value"
            stroke="#A78BFA"
            strokeWidth={1.5}
            fill="#8B5CF6"
            fillOpacity={0.25}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

AttributesRadarChart.propTypes = {
  attributes: PropTypes.shape({
    strength: PropTypes.number,
    intelligence: PropTypes.number,
    vitality: PropTypes.number,
    willpower: PropTypes.number,
    perception: PropTypes.number,
  }),
};

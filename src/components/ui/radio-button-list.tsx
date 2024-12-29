import { RadioButton as RadioButtonListOption, RadioButtonProps } from './radio-button';

export type RadioButtonListOption = Pick<RadioButtonProps, 'value' | 'label' | 'description'>;

type RadioButtonListProps = {
  name: string;
  options: RadioButtonListOption[];
  value: string;
  onChange: (value: string) => void;
};

export const RadioButtonList = ({ name, options, value, onChange }: RadioButtonListProps) => {
  const onRadioButtonChange = (value: string) => {
    onChange(value);
  };

  return (
    <ul>
      {options.map((option) => {
        return (
          <li key={option.value}>
            <RadioButtonListOption
              name={name}
              value={option.value}
              label={option.label}
              description={option.description}
              checked={value === option.value}
              onChange={onRadioButtonChange}
            />
          </li>
        );
      })}
    </ul>
  );
};

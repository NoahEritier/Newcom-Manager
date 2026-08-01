import { Dropdown } from './Dropdown';

type Props = {
  value: boolean;
  onChange: (value: boolean) => void;
  yesLabel?: string;
  noLabel?: string;
};

export function YesNoPills({ value, onChange, yesLabel = 'Sí', noLabel = 'No' }: Props) {
  return (
    <Dropdown
      value={value ? 'yes' : 'no'}
      options={[
        { value: 'yes', label: yesLabel },
        { value: 'no', label: noLabel },
      ]}
      onChange={(v) => onChange(v === 'yes')}
    />
  );
}

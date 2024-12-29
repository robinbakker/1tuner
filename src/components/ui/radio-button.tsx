export type RadioButtonProps = {
  name: string;
  label: string;
  value: string;
  checked: boolean;
  description?: string;
  onChange: (value: string) => void;
};

export const RadioButton = ({ name, label, value, checked, description, onChange }: RadioButtonProps) => {
  const id = `${name}-${value}`;

  const onClick = (e: MouseEvent) => {
    onChange((e.currentTarget as HTMLInputElement).value);
  };

  return (
    <div class="inline-flex items-center my-2">
      <label class="relative flex items-center cursor-pointer">
        <input
          id={id}
          type="radio"
          name={name}
          value={value}
          onClick={onClick}
          checked={checked}
          class="peer h-5 w-5 cursor-pointer appearance-none rounded-full border border-stone-400 dark:border-stone-200 dark:checked:border-stone-300 transition-all"
        />
        <span class="absolute bg-stone-800 dark:bg-stone-200 w-3 h-3 rounded-full opacity-0 peer-checked:opacity-100 transition-opacity duration-200 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></span>
      </label>
      <label for={id} class="ml-2 cursor-pointer text-sm">
        <div>
          <p class="font-medium">{label}</p>
          {!!description && <p class="text-muted-foreground">{description}</p>}
        </div>
      </label>
    </div>
  );
};

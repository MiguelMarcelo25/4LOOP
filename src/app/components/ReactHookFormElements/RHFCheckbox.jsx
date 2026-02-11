import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import { Controller } from 'react-hook-form';

const RHFCheckbox = ({
  control = null,
  name,
  label,
  defaultValue = false,
  sx = {},
  size = 'small',
  className = '',
  value,
  onChange,
  ...rest
}) => {
  const darkModeSx = {
    color: 'var(--foreground)',
    '& .MuiTypography-root': {
      color: 'var(--foreground)',
    },
    '& .MuiCheckbox-root': {
      color: 'rgba(148, 163, 184, 0.5)',
      '&.Mui-checked': {
        color: '#3b82f6',
      },
    },
    ...sx
  };

  return control ? (
    <Controller
      name={name}
      control={control}
      defaultValue={defaultValue}
      render={({ field }) => (
        <FormControlLabel
          className={className}
          sx={darkModeSx}
          control={
            <Checkbox
              {...field}
              checked={!!field.value}
              size={size}
              {...rest}
            />
          }
          label={label}
        />
      )}
    />
  ) : (
    <FormControlLabel
      className={className}
      sx={darkModeSx}
      control={
        <Checkbox
          checked={!!value}
          onChange={onChange}
          size={size}
          {...rest}
        />
      }
      label={label}
    />
  );
};

export default RHFCheckbox;

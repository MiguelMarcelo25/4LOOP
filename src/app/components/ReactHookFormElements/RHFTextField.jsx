import TextField from '@mui/material/TextField';
import { Controller } from "react-hook-form";

const RHFTextField = ({
  control,
  name,
  label,
  placeholder,
  error,
  helperText,
  variant="outlined",
  type="text",
  size="normal",
  ...other
}) => {
  return (
    <Controller
      name={name}
      control={control}
      defaultValue={""}
      render={({field}) => <TextField
          {...field}
          className={`textArea ${other.className || ''}`}
          label={label}
          variant={variant}
          placeholder={placeholder}
          error={error}
          type={type}
          sx={{ 
            width: '100%',
            '& .MuiOutlinedInput-root': {
              backgroundColor: 'var(--background)',
              '& fieldset': {
                borderColor: 'rgba(148, 163, 184, 0.3)',
              },
              '&:hover fieldset': {
                borderColor: 'rgba(148, 163, 184, 0.5)',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#3b82f6',
              },
            },
            '& .MuiInputLabel-root': {
              color: 'var(--foreground)',
            },
            '& .MuiInputBase-input': {
              color: 'var(--foreground)',
            },
            '& .MuiFormHelperText-root': {
              color: error ? '#ef4444' : 'rgba(148, 163, 184, 0.8)',
            },
            ...other.sx 
          }}
          helperText={helperText}
          size={size}
          {...other}
      />
  }/>
  );
};
export default RHFTextField;
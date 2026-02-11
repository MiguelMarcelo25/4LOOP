import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import { Controller } from "react-hook-form";
import FormHelperText from '@mui/material/FormHelperText';

const RHFSelect = ({
  name,
  label,
  control,
  defaultValue,
  error,
  errors,
  children,
  size="small",
  sx,
  ...props
}) => {
  const labelId = `${name}-label`;
  return (
    <FormControl {...props} error={error} size={size}>
      <InputLabel id={labelId} sx={{ color: 'var(--foreground)' }}>{label}</InputLabel>
      <Controller
        name={name}
        control={control}
        defaultValue={defaultValue}
        render={({field})=>{
          return <Select 
                {...field}
                defaultValue={defaultValue}
                labelId={labelId}
                label={label}
                sx={{
                  backgroundColor: 'var(--background)',
                  color: 'var(--foreground)',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(148, 163, 184, 0.3)',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(148, 163, 184, 0.5)',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#3b82f6',
                  },
                  '& .MuiSvgIcon-root': {
                    color: 'var(--foreground)',
                  },
                  ...sx
                }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      backgroundColor: 'var(--background)',
                      color: 'var(--foreground)',
                      '& .MuiMenuItem-root': {
                        color: 'var(--foreground)',
                        '&:hover': {
                          backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        },
                        '&.Mui-selected': {
                          backgroundColor: 'rgba(59, 130, 246, 0.2)',
                          '&:hover': {
                            backgroundColor: 'rgba(59, 130, 246, 0.3)',
                          },
                        },
                      },
                    },
                  },
                }}
                >
                    {children}
                </Select>
        }}
      />
      {error ? <FormHelperText sx={{ color: '#ef4444' }}>{error?.message}</FormHelperText> : ""}
    </FormControl>
  );
};
export default RHFSelect;
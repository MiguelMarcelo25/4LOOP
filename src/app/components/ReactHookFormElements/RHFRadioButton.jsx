import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import UserIcon from '@/assets/ic_user.svg'
import Image from "next/image";
import { Controller } from "react-hook-form";

const RHFRadioButton = ({
  control,
  name,
  label,
  defaultValue=false,
  sx={},
  size = 'small',
  className = "",
  options = [],
  showImage = false
}) => {
  return (
    <Controller
      name={name}
      control={control}
      defaultValue={defaultValue}
      render={({ field }) =>(
        <RadioGroup
        className='flex items-stretch max-h-[calc(100vh-300px)] overflow-auto'
        sx={{flexDirection: "row"}}
        {...field}>
          {options.map(option=>{
            return <FormControlLabel
              key={option.value}
              value={option.value}
              sx={{
                width: "100%",
                color: 'var(--foreground)',
                '& .MuiTypography-root': {
                  color: 'var(--foreground)',
                },
                '& .MuiRadio-root': {
                  color: 'rgba(148, 163, 184, 0.5)',
                  '&.Mui-checked': {
                    color: '#3b82f6',
                  },
                },
              }}
              control={<Radio />}
              label={
                <div className='flex items-center gap-8'>
                  {
                  showImage ? 
                    <div className="flex rounded-full overflow-hidden">
                      <Image
                      quality={50}
                      src={option?.image ? option.image : UserIcon}
                      height={30}
                      width={30}
                      alt={"submit"}/>
                    </div> : null 
                  }
                  {option.label}
                </div>
              }
            />
          })}
        </RadioGroup>
      )}
    />
  );
};
export default RHFRadioButton;
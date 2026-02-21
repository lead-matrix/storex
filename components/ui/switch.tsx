import * as React from 'react';
import * as RadixSwitch from '@radix-ui/react-switch';
import './Switch.css'; // add a CSS file for styling if needed

const Switch = React.forwardRef((props, ref) => {
  return (
    <RadixSwitch.Root ref={ref} className="SwitchRoot" {...props}>
      <RadixSwitch.Thumb className="SwitchThumb" />
    </RadixSwitch.Root>
  );
});

Switch.displayName = 'Switch';
export default Switch;

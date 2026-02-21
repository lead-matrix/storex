import { Sheet } from "shadcn/ui";

const SheetComponent = () => {
    return (
        <Sheet>
            <Sheet.Trigger>Open Sheet</Sheet.Trigger>
            <Sheet.Content>
                <Sheet.Close>Close</Sheet.Close>
                <h1>Sheet Content</h1>
            </Sheet.Content>
        </Sheet>
    );
};

export default SheetComponent;
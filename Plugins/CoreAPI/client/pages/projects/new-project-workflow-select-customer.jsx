import React, { useState, useEffect } from "react";
import { Components, registerComponent, Utils } from "@penpal/core";
import _ from "lodash";
import { Check, ChevronsUpDown } from "lucide-react";

const {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Button,
  Separator,
} = Components;

const { cn } = Utils;

const SelectCustomer = ({
  enableNext = () => null,
  disableNext = () => null,
  selectedCustomer,
  setSelectedCustomer,
  customers,
}) => {
  // ----------------------------------------------------
  const [popoverOpen, setPopoverOpen] = useState(false);

  useEffect(() => {
    if (selectedCustomer !== "") {
      enableNext();
    } else {
      disableNext();
    }
  }, [selectedCustomer]);

  // ----------------------------------------------------

  const handleNewCustomer = (all_customers, new_customer) => {
    const new_customer_index = _.findIndex(
      all_customers,
      (customer) => customer.id === new_customer.id
    );

    // Delay this by a scosh to avoid a warning on the race condition
    setTimeout(() => setSelectedCustomer(new_customer_index.toString()), 50);
  };

  // ----------------------------------------------------

  return (
    <div className="w-full h-full flex flex-row justify-evenly items-stretch gap-4">
      <div className="flex flex-col justify-start items-start flex-1 pt-2">
        <div className="text-[#555] text-[17px] uppercase w-full text-center mb-2">
          Select Customer
        </div>
        <div className="flex-1 flex flex-col justify-start items-start w-full">
          <Popover
            open={popoverOpen}
            onOpenChange={setPopoverOpen}
            modal={true}
          >
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={popoverOpen}
                className="w-full justify-between"
              >
                {selectedCustomer !== ""
                  ? customers[selectedCustomer]?.name
                  : "Select a customer..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
              <Command>
                <CommandInput placeholder="Search customer..." />
                <CommandList>
                  <CommandEmpty>No customer found.</CommandEmpty>
                  <CommandGroup>
                    {customers.map((customer, index) => (
                      <CommandItem
                        key={customer.id}
                        value={index.toString()}
                        onSelect={(currentValue) => {
                          setSelectedCustomer(
                            currentValue === selectedCustomer
                              ? ""
                              : currentValue
                          );
                          setPopoverOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedCustomer === index.toString()
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        {customer.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </div>
      <Separator orientation="vertical" className="h-auto" />
      <div className="flex flex-col justify-start items-start flex-1 pt-2">
        <div className="text-[#555] text-[17px] uppercase w-full text-center mb-2">
          New Customer
        </div>
        <div className="flex-1 flex flex-col justify-start items-start w-full mb-4">
          <Components.NewCustomerForm newCustomerHook={handleNewCustomer} />
        </div>
      </div>
    </div>
  );
};

registerComponent("NewProjectWorkflowSelectCustomer", SelectCustomer);

// This is only needed for the fast refresh plugin, the registerComponent above is needed for the plugin system
export default SelectCustomer;

import React, { useState } from "react";
import { Components, registerComponent, Hooks, Utils } from "@penpal/core";
import { Check, ChevronsUpDown } from "lucide-react";

import { useMutation, useQuery, useApolloClient } from "@apollo/client";
import CreateNewCustomer from "./mutations/create-new-customer.ts";
import GetCustomers from "./queries/get-customers.ts";

interface Customer {
  id: string;
  name: string;
  industry: string;
}

interface GetCustomersData {
  getCustomers: Customer[];
}

interface CreateCustomerData {
  createCustomer: Customer;
}

interface CreateCustomerVariables {
  name: string;
  industry: string;
}

const { cn } = Utils;
const {
  Button,
  Input,
  Label,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Popover,
  PopoverContent,
  PopoverTrigger,
} = Components;

interface NewCustomerFormProps {
  newCustomerHook?: (customers: Customer[], newCustomer: Customer) => void;
}

const NewCustomerForm: React.FC<NewCustomerFormProps> = ({ newCustomerHook = () => null }) => {
  // ----------------------------------------------------
  const { useIntrospection } = Hooks;

  const [customerName, setCustomerName] = useState("");
  const [customerIndustry, setCustomerIndustry] = useState("");
  const [newCustomerPending, setNewCustomerPending] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const { loading, types } = useIntrospection();

  const [
    createNewCustomer,
    { loading: create_customer_loading, error: create_customer_error },
  ] = useMutation<CreateCustomerData, CreateCustomerVariables>(CreateNewCustomer, {
    update(cache: any, result: any) {
      const new_customer = result.data.createCustomer;
      const current_customers =
        cache.readQuery({ query: GetCustomers })?.getCustomers ?? [];
      const data = { getCustomers: [...current_customers, new_customer] };
      cache.writeQuery({
        query: GetCustomers,
        data,
      });

      newCustomerHook(data.getCustomers, new_customer);
    },
  });

  // ----------------------------------------------------

  const industries = loading
    ? []
    : types.Industry.enumValues.map((value: any) => value.name);

  // ----------------------------------------------------

  const handleCustomerNameChange = (event: React.ChangeEvent<HTMLInputElement>) =>
    setCustomerName(event.target.value);
  const submitNewCustomer = () => {
    setNewCustomerPending(true);
    createNewCustomer({
      variables: {
        name: customerName,
        industry: customerIndustry,
      },
    });
    setCustomerName("");
    setCustomerIndustry("");
    setNewCustomerPending(false);
  };

  return (
    <div className="flex flex-col justify-start items-start h-full w-full space-y-4">
      <div className="w-full max-w-sm space-y-2">
        <Input
          id="customer-name"
          value={customerName}
          onChange={handleCustomerNameChange}
          placeholder="Enter customer name"
        />
      </div>

      <div className="w-full max-w-sm space-y-2">
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen} modal={true}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={popoverOpen}
              className="w-full justify-between"
            >
              {customerIndustry
                ? industries.find((industry: string) => industry === customerIndustry)
                : "Select an industry..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0">
            <Command>
              <CommandInput placeholder="Search industries..." />
              <CommandList>
                <CommandEmpty>No industry found.</CommandEmpty>
                <CommandGroup>
                  {industries.map((industry: string) => (
                    <CommandItem
                      key={industry}
                      value={industry}
                      onSelect={(currentValue: string) => {
                        setCustomerIndustry(
                          currentValue === customerIndustry ? "" : currentValue
                        );
                        setPopoverOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          customerIndustry === industry
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                      {industry}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      <Button
        className="w-80"
        disabled={customerName.length === 0 || customerIndustry === ""}
        onClick={submitNewCustomer}
      >
        Submit
      </Button>
    </div>
  );
};

registerComponent("NewCustomerForm", NewCustomerForm);

// This is only needed for the fast refresh plugin, the registerComponent above is needed for the plugin system
export default NewCustomerForm;

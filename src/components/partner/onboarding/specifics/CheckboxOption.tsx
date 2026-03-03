import { Check } from "lucide-react";

export const CheckboxOption = ({ label, checked, onChange }: { label: string, checked: boolean, onChange: () => void }) => (
    <label className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${checked ? 'border-[#B79A63] bg-[#F8F5F0]' : 'border-[#D4D2CF]/60 bg-white hover:border-[#B79A63]/50'
        }`}>
        <div className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center ${checked ? 'bg-[#B79A63] border-[#B79A63]' : 'border-[#D4D2CF]'
            }`}>
            {checked && <Check className="w-3.5 h-3.5 text-white" />}
        </div>
        <input
            type="checkbox"
            className="hidden"
            checked={checked}
            onChange={onChange}
        />
        <span className="text-sm text-[#1E1E1E] font-medium leading-tight">{label}</span>
    </label>
);

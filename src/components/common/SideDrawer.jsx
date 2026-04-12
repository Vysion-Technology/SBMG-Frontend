import React, { useEffect, useState } from "react";
import { X } from "lucide-react";

const SlideDrawer = ({
    trigger,
    open: controlledOpen,
    onClose,
    title,
    children,
    clickFunction,
    width = "md:w-[85%]"
}) => {

    const [internalOpen, setInternalOpen] = useState(false);

    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : internalOpen;

    const setOpen = (val) => {
        if (isControlled) {
            if (!val) onClose?.();
        } else {
            setInternalOpen(val);
        }
    };

    useEffect(() => {
        document.body.style.overflow = open ? "hidden" : "unset";
    }, [open]);

    const handleOpen = () => {
        setOpen(true);
        clickFunction?.();
    };

    const handleClose = () => {
        setOpen(false);
        onClose?.();
    };

    return (
        <>
            {/* TRIGGER (RightDrawer style) */}
            {trigger &&
                React.cloneElement(trigger, {
                    onClick: handleOpen
                })}

            {/* BACKDROP */}
            <div
                className={`fixed inset-0 z-[50] bg-black/30 backdrop-blur-[2px] transition-all duration-300 ${open ? "opacity-100 visible" : "opacity-0 invisible"
                    }`}
                onClick={handleClose}
            />

            {/* DRAWER */}
            <aside
                className={`fixed top-0 right-0 h-full z-50 bg-white w-full ${width}
        transition-transform duration-300
        ${open ? "translate-x-0" : "translate-x-full"}`}
            >
                {/* HEADER */}
                <div className="flex items-center justify-between !p-4">
                    <h2 className="font-bold text-gray-800">{title}</h2>
                    <button className="cursor-pointer" onClick={handleClose}>
                        <X />
                    </button>
                </div>

                {/* BODY */}
                <div className="h-[calc(100vh-60px)] overflow-y-auto !p-4">
                    {children}
                </div>
            </aside>
        </>
    );
};

export default SlideDrawer;
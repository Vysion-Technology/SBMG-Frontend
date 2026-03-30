import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

const RightDrawer = ({ clickFunction, trigger, title, children }) => {
    const [isOpen, setIsOpen] = useState(false);

    // Prevent scrolling when drawer is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
    }, [isOpen]);

    return (
        <>
            {/* 1. The Trigger: Clones the passed element and adds an onClick */}
            {React.cloneElement(trigger, { onClick: (e) => { e.stopPropagation(); e.preventDefault(); setIsOpen(true); clickFunction() } })}

            {/* 2. Overlay Backdrop */}
            <div
                className={`fixed z-40 inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
                    }`}
                onClick={() => setIsOpen(false)}
            />

            {/* 3. The Drawer Panel */}
            <aside className={`fixed top-0 right-0 h-full z-50 bg-white transition-transform duration-500 ease-out w-full p-4! md:w-3/4 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>

                {/* Header */}
                <div className="flex items-center justify-between p-4!">
                    <h2 className="text-lg font-bold text-gray-800">{title}</h2>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-2 cursor-pointer"
                    >
                        <X size={26} className="text-black" />
                    </button>
                </div>

                {/* Scrollable Content Area */}
                <div className="h-[calc(100vh-64px)] overflow-y-auto p-6">
                    {children}
                </div>
            </aside>
        </>
    );
};

export default RightDrawer;
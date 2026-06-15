import React, { useState, useEffect } from 'react';
import { X, ChevronLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const RightDrawer = ({ clickFunction, trigger, title, children, showBack = false, backLabel = 'Back', backFunction }) => {
    const [isOpen, setIsOpen] = useState(false);

    const { t } = useTranslation(['dashboard', 'common']);
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
            <aside className={`fixed top-0 right-0 h-full z-50 bg-white transition-transform duration-500 ease-out w-full p-4! md:w-[85%] cursor-default ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>

                {/* Header */}
                <div className="flex items-center justify-between p-4! border-b border-slate-200">
                    <h2 className="text-lg font-bold text-gray-800"> {t(`assets.${title}`, title)}</h2>
                    <div className="flex items-center gap-2">
                        {showBack && (
                            <button
                                type="button"
                                onClick={() => {
                                    if (typeof backFunction === 'function') {
                                        backFunction();
                                    } else {
                                        setIsOpen(false);
                                    }
                                }}
                                className="inline-flex items-center gap-2 rounded border border-slate-300 px-3! py-2! text-sm font-medium text-slate-700 ease-in-out duration-300 hover:bg-slate-100 focus:outline-none cursor-pointer"
                            >
                                <ChevronLeft size={18} />
                                <span>{backLabel}</span>
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="p-2 rounded hover:bg-slate-100 cursor-pointer"
                            aria-label="Close drawer"
                        >
                            <X size={26} className="text-black" />
                        </button>
                    </div>
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
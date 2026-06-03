const DashBoardCards = ({ title, value, bgColorOverlay, textColor, bgImg, border, onClick, width = "270px", }) => {
    const formatNumber = (val) => {
        if (val === "" || val === null || val === undefined) return "-";

        // 👉 agar string me unit hai (km, m, etc) → direct return
        if (typeof val === "string" && isNaN(Number(val))) {
            return val;
        }

        const num = Number(val);
        if (isNaN(num)) return "-";

        return num.toLocaleString("en-IN");
    };
    return (
        <div onClick={onClick}
            className={`relative rounded-xl    overflow-hidden p-4! border cursor-pointer flex flex-col justify-between`}
            style={{ borderColor: border, width: width }}
        >
            {/* Background */}
            <div
                className="absolute inset-0"
                style={{
                    background: `url(${bgImg}) no-repeat`,
                    backgroundPosition: "right bottom",
                    backgroundSize: "contain",
                }}
            />

            {/* Overlay */}
            <div
                className="absolute inset-0"
                style={{ backgroundColor: bgColorOverlay, opacity: 0.7 }}
            />

            {/* Content */}
            <div className="relative z-10 p-2!">
                <p style={{ color: textColor }}>{title}</p>

                {/* ✅ CASE 1: Single value */}
                {typeof value === "string" || typeof value === "number" ? (
                    <h1 className="text-xl font-semibold text-gray-900">
                        {formatNumber(value)}
                    </h1>
                ) : null}

                {/* ✅ CASE 2: Multiple values (array) */}
                {Array.isArray(value) && (
                    <div className="flex gap-8 mt-1">
                        {value.map((item, i) => (
                            <div key={i}>
                                <h1 className="text-lg font-semibold text-gray-900">
                                    {formatNumber(item.value)}
                                </h1>
                                <p className="text-xs text-gray-600">{item.label}</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* ✅ CASE 3: Object values */}
                {typeof value === "object" && !Array.isArray(value) && (
                    <div className="flex gap-8 mt-1">
                        {Object.entries(value).map(([key, val], i) => (
                            <div key={i}>
                                <h1 className="text-lg font-semibold text-gray-900">
                                    {formatNumber(val)}
                                </h1>
                                <p className="text-xs text-gray-600 capitalize">
                                    {key}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DashBoardCards;
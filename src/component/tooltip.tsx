import React, {useId, useRef, useState} from 'react';
import './tooltip.min.css';

interface ITooltip {
    children: React.ReactNode|string;
    title: React.ReactNode;
    arrow?: boolean;
    onTooltipEnter?(): void;
    onTooltipLeave?(): void;
}

const Tooltip: React.FC<ITooltip> = (props) => {
    const { children, title, arrow, onTooltipEnter, onTooltipLeave } = props;
    const ENTER_DELAY_IN_MS = 200;
    const id = useId();
    const tooltipWrapper = useRef<HTMLDivElement>();
    const tooltip = useRef<HTMLDivElement>();
    const [tooltipHidden, setTooltipHidden] = useState(true);
    const [hoveringOverTooltip, setHoveringOverTooltip] = useState<boolean>(false);
    const [position, setPosition] = useState<{ x?: number, y?: number }>({});
    const [timeoutId, setTimeoutId] = useState<number|undefined>();
    const [containerWidth, setContainerWidth] = useState<number>(0);

    const handleMouseEnter = () => {
        const { x, y, width, height } = tooltipWrapper?.current.getBoundingClientRect();

        setContainerWidth(width);

        const tid = setTimeout(() => {
            setPosition({
                x: x,
                y: y + height + (arrow ? 8 : 0)
            });
            setTooltipHidden(false);
        }, ENTER_DELAY_IN_MS);
        setTimeoutId(tid as unknown as number);
    };

    const handleMouseLeave = () => {
        setTimeout(() => {
            if (hoveringOverTooltip) {
                return;
            }

            clearTimeout(timeoutId);
            setTooltipHidden(true);
        }, 100);
    };

    const handleMouseEnterTooltip = () => {
        setHoveringOverTooltip(true);
        onTooltipEnter?.();
    };

    const handleMouseLeaveTooltip = () => {
        setHoveringOverTooltip(false);
        setTooltipHidden(true);
        onTooltipLeave?.();
    };

    return (
        <div
            className="tooltip-wrapper"
            ref={tooltipWrapper}
            aria-describedby={id}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {children}
            <div
                className={`tooltip ${arrow ? 'arrow': ''}`.trim()}
                ref={tooltip}
                role="tooltip"
                hidden={tooltipHidden}
                id={id}
                style={{
                    '--container-width': `${containerWidth}px`,
                    top: `${position.y}px`,
                    left: `${position.x}px`
                } as React.CSSProperties}
                onMouseEnter={handleMouseEnterTooltip}
                onMouseLeave={handleMouseLeaveTooltip}
            >
                {title}
            </div>
        </div>
    );
}

export default Tooltip;

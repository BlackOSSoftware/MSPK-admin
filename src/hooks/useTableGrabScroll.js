import { useEffect } from 'react';

const isInteractiveTarget = (target) => {
    if (!(target instanceof Element)) return false;
    return Boolean(
        target.closest(
            'a, button, input, textarea, select, [role="button"], [contenteditable="true"], [data-grab-scroll="off"]'
        )
    );
};

const findScrollableParent = (element) => {
    let node = element;
    while (node && node !== document.body) {
        const styles = window.getComputedStyle(node);
        const overflowX = styles.overflowX;
        const overflowY = styles.overflowY;
        const canScrollX = (overflowX === 'auto' || overflowX === 'scroll') && node.scrollWidth > node.clientWidth;
        const canScrollY = (overflowY === 'auto' || overflowY === 'scroll') && node.scrollHeight > node.clientHeight;
        if (canScrollX || canScrollY) return node;
        node = node.parentElement;
    }
    return null;
};

const useTableGrabScroll = () => {
    useEffect(() => {
        let isDragging = false;
        let startX = 0;
        let startY = 0;
        let startLeft = 0;
        let startTop = 0;
        let scrollEl = null;

        const onPointerDown = (event) => {
            if (event.button !== 0) return;
            if (event.pointerType === 'touch') return;
            if (!(event.target instanceof Element)) return;

            const table = event.target.closest('table');
            if (!table) return;
            if (isInteractiveTarget(event.target)) return;

            const scroller = findScrollableParent(table);
            if (!scroller) return;

            isDragging = true;
            scrollEl = scroller;
            startX = event.clientX;
            startY = event.clientY;
            startLeft = scroller.scrollLeft;
            startTop = scroller.scrollTop;
            scroller.classList.add('table-grab-active');
            document.body.classList.add('table-grabbing');
            event.preventDefault();
        };

        const onPointerMove = (event) => {
            if (!isDragging || !scrollEl) return;
            const dx = event.clientX - startX;
            const dy = event.clientY - startY;
            scrollEl.scrollLeft = startLeft - dx;
            scrollEl.scrollTop = startTop - dy;
        };

        const endDrag = () => {
            if (!isDragging) return;
            isDragging = false;
            if (scrollEl) {
                scrollEl.classList.remove('table-grab-active');
            }
            document.body.classList.remove('table-grabbing');
            scrollEl = null;
        };

        document.addEventListener('pointerdown', onPointerDown, { capture: true });
        document.addEventListener('pointermove', onPointerMove);
        document.addEventListener('pointerup', endDrag);
        document.addEventListener('pointercancel', endDrag);

        return () => {
            document.removeEventListener('pointerdown', onPointerDown, { capture: true });
            document.removeEventListener('pointermove', onPointerMove);
            document.removeEventListener('pointerup', endDrag);
            document.removeEventListener('pointercancel', endDrag);
        };
    }, []);
};

export default useTableGrabScroll;

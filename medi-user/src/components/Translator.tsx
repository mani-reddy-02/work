import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

const originalTextMap = new WeakMap<Node, string>();

const Translator = () => {
  const { t, i18n } = useTranslation();
  const isTranslating = useRef(false);

  useEffect(() => {
    const translateNode = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent?.trim();
        if (!text) return;

        // Skip translation for material icons, script tags, style tags
        const parent = node.parentElement;
        if (parent && (parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE')) return;

        if (!originalTextMap.has(node)) {
          originalTextMap.set(node, node.textContent || '');
        }

        const originalText = originalTextMap.get(node) || '';
        const trimmedOriginal = originalText.trim();
        const translated = t(trimmedOriginal);

        // Determine if we should translate based on i18next language state
        const isTe = i18n.language?.startsWith('te');

        if (isTe && translated !== trimmedOriginal) {
          const newText = originalText.replace(trimmedOriginal, translated);
          if (node.textContent !== newText) {
            isTranslating.current = true;
            node.textContent = newText;
            setTimeout(() => { isTranslating.current = false; }, 0);
          }
        } else if (!isTe) {
          if (node.textContent !== originalText) {
            isTranslating.current = true;
            node.textContent = originalText;
            setTimeout(() => { isTranslating.current = false; }, 0);
          }
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          const inputEl = el as HTMLInputElement;
          if (inputEl.placeholder) {
            const key = '__original_placeholder';
            if (!(el as any)[key]) {
              (el as any)[key] = inputEl.placeholder;
            }
            const originalPlaceholder = (el as any)[key];
            const translated = t(originalPlaceholder);
            const isTe = i18n.language?.startsWith('te');

            if (isTe && translated !== originalPlaceholder) {
              if (inputEl.placeholder !== translated) {
                isTranslating.current = true;
                inputEl.placeholder = translated;
                setTimeout(() => { isTranslating.current = false; }, 0);
              }
            } else if (!isTe) {
              if (inputEl.placeholder !== originalPlaceholder) {
                isTranslating.current = true;
                inputEl.placeholder = originalPlaceholder;
                setTimeout(() => { isTranslating.current = false; }, 0);
              }
            }
          }
        }
      }
    };

    const walk = (node: Node) => {
      translateNode(node);
      node.childNodes.forEach(walk);
    };

    walk(document.body);

    const observer = new MutationObserver((mutations) => {
      if (isTranslating.current) return;

      mutations.forEach(mutation => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(walk);
        } else if (mutation.type === 'characterData') {
          const node = mutation.target;
          
          const original = originalTextMap.get(node) || '';
          if (original) {
             const expectedTranslation = t(original.trim());
             const expectedText = original.replace(original.trim(), expectedTranslation);
             // If the current text matches our expected translated text, it's not a real DOM change we care about re-translating.
             if (node.textContent === expectedText) {
                 return;
             }
          }

          originalTextMap.set(node, node.textContent || '');
          translateNode(node);
          
        } else if (mutation.type === 'attributes' && mutation.attributeName === 'placeholder') {
          const el = mutation.target as any;
          const current = el.placeholder;
          
          const original = el.__original_placeholder;
          if (original && current === t(original)) {
            return;
          }
          
          el.__original_placeholder = current;
          translateNode(el);
        }
      });
    });

    observer.observe(document.body, { 
      childList: true, 
      subtree: true, 
      characterData: true,
      attributes: true,
      attributeFilter: ['placeholder']
    });

    return () => observer.disconnect();
  }, [i18n.language, t]);

  return null;
};

export default Translator;

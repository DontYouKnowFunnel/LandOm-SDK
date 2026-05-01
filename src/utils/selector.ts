/**
 * 요소의 CSS selector를 생성한다.
 * LandOm-LLM의 html_tools/selector_lookup.py:build_css_selector와 동일한 규칙을 따른다.
 * 규칙이 어긋나면 백엔드의 selector→funnel 매핑이 깨지므로 변경 시 LLM 쪽과 동기화 필수.
 *
 * 규칙:
 *   1) id 속성이 있으면 `tag[id="..."]`를 쓰고 더 이상 위로 올라가지 않는다
 *   2) 그 외에는 `tag:nth-of-type(N)` (같은 태그명 형제 중 1-based 위치)
 *   3) 결합자는 ` > ` (직계 자식)
 *   4) root까지만 올라간다 (기본값 document.body)
 */
export function buildCssSelector(node: Element, root: Element = document.body): string {
  const parts: string[] = [];
  const rootParent = root.parentElement;
  let current: Element | null = node;

  while (current) {
    if (current === rootParent) break;

    const id = current.getAttribute('id');
    if (id) {
      const safeId = id.replace(/"/g, '\\"');
      parts.push(`${current.tagName.toLowerCase()}[id="${safeId}"]`);
      break;
    }

    let position = 1;
    let sib: Element | null = current.previousElementSibling;
    while (sib) {
      if (sib.tagName === current.tagName) position++;
      sib = sib.previousElementSibling;
    }
    parts.push(`${current.tagName.toLowerCase()}:nth-of-type(${position})`);

    if (current === root) break;
    current = current.parentElement;
  }

  return parts.reverse().join(' > ');
}

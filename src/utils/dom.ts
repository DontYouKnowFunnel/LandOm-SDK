/**
 * DOM 요소에서 식별자를 추출한다
 * 우선순위: #id > tag.firstClass > tag
 * 클릭, 입력, 이탈 이벤트에서 타겟 요소를 식별하는 데 사용
 */
export function getElementId(el: Element): string {
  // 1순위: id 속성
  if (el.id) {
    return `#${el.id}`;
  }

  const tag = el.tagName.toLowerCase();

  // 2순위: 태그명 + 첫 번째 클래스
  if (typeof el.className === 'string' && el.className.trim()) {
    const firstClass = el.className.trim().split(/\s+/)[0];
    return `${tag}.${firstClass}`;
  }

  // 3순위: 태그명만
  return tag;
}

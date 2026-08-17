export type BlogPost = {
  slug: string
  title: string
  date: string
  summary: string
  content: string
}

export const blogPosts: BlogPost[] = [
  {
    slug: 'solo-dev-culture',
    title: '혼자서 개발 문화 만들기',
    date: '2025-05-06',
    summary: '팀이 없어도 성장하는 개발자가 되기 위해 혼자서 개발 문화를 흉내내는 방법',
    content: `
      <div class="prose prose-sm max-w-none">
        <h2>시작하며</h2>
        <p>좋은 개발 문화는 팀에서 나온다고 알려져 있습니다. 하지만 당신이 혼자라면 어떻게 할까요? <strong>"환경 탓 안 하고 본인이 환경을 만드는 사람"</strong>의 사고방식이 여기서 시작됩니다.</p>
        <p>회사가 안 해주면 혼자라도 흉내 내보는 것. 이게 면접에서도 엄청 좋은 스토리가 돼요.</p>

        <h2>팀 문화와 혼자 버전의 변형</h2>
        <p>CDRI 글에 나온 개발 문화들을 보면 대부분 <strong>"팀이 있어야 가능한 것들"</strong>입니다. 그래서 이걸 혼자서 어떻게 흉내 낼까가 핵심이에요.</p>

        <h3>1. Tech Talk → 주 1회 기술 아티클 정독 + 블로그 정리</h3>
        <div class="bg-zinc-50 border border-zinc-200 rounded-lg p-4 mt-3">
          <p><strong>원래:</strong> 팀원들 발표</p>
          <p class="mt-2"><strong>혼자 버전:</strong> 주 1회 기술 아티클 정독 + 블로그 정리. 발표 대신 글로 남기기. Medium이나 Velog에 올리면 더 좋음</p>
          <p class="mt-2"><strong>면접 스토리:</strong> "저는 매주 흥미로운 기술 글을 읽고 블로그에 정리하고 있습니다. 지금까지 20개의 정리 글을 올렸고..."</p>
        </div>

        <h3>2. 칸반 → Notion이나 Trello로 본인 태스크 관리</h3>
        <div class="bg-zinc-50 border border-zinc-200 rounded-lg p-4 mt-3">
          <p><strong>원래:</strong> 팀 데일리 스크럼</p>
          <p class="mt-2"><strong>혼자 버전:</strong> Notion이나 Trello로 본인 태스크 관리. ToDo / Doing / Done 본인 혼자 운영. 매일 아침 5분 본인이 본인한테 데일리 스크럼 (어제 한 일, 오늘 할 일, 막힌 점)</p>
          <p class="mt-2"><strong>면접 스토리:</strong> "저는 매일 아침 5분 정도 본인 진행 상황을 점검하는 습관이 있습니다. 이를 통해..."</p>
        </div>

        <h3>3. 코드 리뷰 → 셀프 코드 리뷰 + AI 활용</h3>
        <div class="bg-zinc-50 border border-zinc-200 rounded-lg p-4 mt-3">
          <p><strong>원래:</strong> PR에 동료가 코멘트</p>
          <p class="mt-2"><strong>혼자 버전:</strong> PR 올린 다음 본인이 하루 묵혔다가 다시 보기 (이거 진짜 효과 있어요. 하루 지나면 본인 코드도 남 코드처럼 보여요). 그리고 Claude나 GPT한테 "이 코드 리뷰해줘, 개선점 알려줘" 시키기. 완벽하진 않지만 혼자보단 훨씬 나아요</p>
          <p class="mt-2"><strong>면접 스토리:</strong> "코드 리뷰의 중요성을 알아서, PR을 올린 후 하루 지나 본인이 다시 검토하는 습관을 들였습니다. AI 도구도 함께 활용..."</p>
        </div>

        <h3>4. 회고(KPT) → 2주에 한 번 본인 회고 작성</h3>
        <div class="bg-zinc-50 border border-zinc-200 rounded-lg p-4 mt-3">
          <p><strong>원래:</strong> 팀이 함께 돌아보기</p>
          <p class="mt-2"><strong>혼자 버전:</strong> 2주에 한 번 본인 회고 작성. Keep / Problem / Try 항목으로 노션이나 옵시디언에 정리. 이게 1년 쌓이면 본인 성장 기록이고, 면접에서 풀어낼 스토리예요</p>
          <p class="mt-2"><strong>면접 스토리:</strong> "1년간 2주마다 회고를 기록했는데, 이 과정에서 제 약점이 어디인지 명확히 알 수 있었습니다..."</p>
        </div>

        <h3>5. 기술 블로그 → 진짜 운영하기</h3>
        <div class="bg-zinc-50 border border-zinc-200 rounded-lg p-4 mt-3">
          <p><strong>원래:</strong> 팀 내 공유</p>
          <p class="mt-2"><strong>혼자 버전:</strong> 공모전 하면서 배운 거, 사이드 프로젝트 하면서 막힌 거 해결한 과정, 이런 거 글로 정리. 면접관이 GitHub랑 블로그 보면 그게 곧 포트폴리오예요</p>
          <p class="mt-2"><strong>면접 스토리:</strong> "ValkyrieFS 프로젝트를 진행하면서 만난 3가지 문제와 그 해결 과정을 블로그에 올렸습니다..."</p>
        </div>

        <h3>6. 페어 코딩 → 스터디 모임 또는 커뮤니티 참여</h3>
        <div class="bg-zinc-50 border border-zinc-200 rounded-lg p-4 mt-3">
          <p><strong>원래:</strong> 둘이 같이 코딩</p>
          <p class="mt-2"><strong>혼자 버전:</strong> 스터디 모임 참여하거나, 디스코드 개발 커뮤니티 가입. 혼자만으론 한계가 있어서 외부 자극이 필요해요</p>
          <p class="mt-2"><strong>면접 스토리:</strong> "개발 커뮤니티에 참여하면서 다양한 관점을 배웠습니다. 특히..."</p>
        </div>

        <h2>실제로 해보기 - 주간/월간 루틴</h2>
        <table class="w-full border-collapse border border-zinc-300 text-sm mt-4">
          <thead>
            <tr class="bg-zinc-100">
              <th class="border border-zinc-300 px-3 py-2 text-left">항목</th>
              <th class="border border-zinc-300 px-3 py-2 text-left">주기</th>
              <th class="border border-zinc-300 px-3 py-2 text-left">시간</th>
              <th class="border border-zinc-300 px-3 py-2 text-left">도구</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-200">
            <tr>
              <td class="border border-zinc-300 px-3 py-2">데일리 스크럼</td>
              <td class="border border-zinc-300 px-3 py-2">매일</td>
              <td class="border border-zinc-300 px-3 py-2">5분</td>
              <td class="border border-zinc-300 px-3 py-2">Notion</td>
            </tr>
            <tr>
              <td class="border border-zinc-300 px-3 py-2">코드 리뷰</td>
              <td class="border border-zinc-300 px-3 py-2">PR 후</td>
              <td class="border border-zinc-300 px-3 py-2">30분</td>
              <td class="border border-zinc-300 px-3 py-2">GitHub + Claude</td>
            </tr>
            <tr>
              <td class="border border-zinc-300 px-3 py-2">기술 글 정독 + 정리</td>
              <td class="border border-zinc-300 px-3 py-2">주 1회</td>
              <td class="border border-zinc-300 px-3 py-2">1시간</td>
              <td class="border border-zinc-300 px-3 py-2">Blog / Velog</td>
            </tr>
            <tr>
              <td class="border border-zinc-300 px-3 py-2">프로젝트 회고 (KPT)</td>
              <td class="border border-zinc-300 px-3 py-2">2주마다</td>
              <td class="border border-zinc-300 px-3 py-2">30분</td>
              <td class="border border-zinc-300 px-3 py-2">Notion / 옵시디언</td>
            </tr>
            <tr>
              <td class="border border-zinc-300 px-3 py-2">커뮤니티 활동</td>
              <td class="border border-zinc-300 px-3 py-2">수시</td>
              <td class="border border-zinc-300 px-3 py-2">20분</td>
              <td class="border border-zinc-300 px-3 py-2">Discord / GitHub</td>
            </tr>
          </tbody>
        </table>

        <h2>구체적인 실천 체크리스트</h2>
        <div class="space-y-3 mt-4">
          <div class="border border-zinc-300 rounded-lg p-3 flex items-start gap-3">
            <input type="checkbox" class="mt-1 cursor-pointer" />
            <span>매일 아침 오늘의 목표 3가지 적기 (데일리 스크럼)</span>
          </div>
          <div class="border border-zinc-300 rounded-lg p-3 flex items-start gap-3">
            <input type="checkbox" class="mt-1 cursor-pointer" />
            <span>코드 올릴 때마다 하루 지나 다시 한 번 읽어보기</span>
          </div>
          <div class="border border-zinc-300 rounded-lg p-3 flex items-start gap-3">
            <input type="checkbox" class="mt-1 cursor-pointer" />
            <span>PR 링크와 함께 Claude에 "이 코드 리뷰해줄래?" 요청하기</span>
          </div>
          <div class="border border-zinc-300 rounded-lg p-3 flex items-start gap-3">
            <input type="checkbox" class="mt-1 cursor-pointer" />
            <span>주 1회 기술 글 1개 읽고 3줄 요약 블로그에 올리기</span>
          </div>
          <div class="border border-zinc-300 rounded-lg p-3 flex items-start gap-3">
            <input type="checkbox" class="mt-1 cursor-pointer" />
            <span>2주마다 Keep(잘한 점) / Problem(문제) / Try(개선) 작성</span>
          </div>
          <div class="border border-zinc-300 rounded-lg p-3 flex items-start gap-3">
            <input type="checkbox" class="mt-1 cursor-pointer" />
            <span>한 달에 1개 이상 프로젝트 회고글 블로그에 올리기</span>
          </div>
          <div class="border border-zinc-300 rounded-lg p-3 flex items-start gap-3">
            <input type="checkbox" class="mt-1 cursor-pointer" />
            <span>개발 커뮤니티(Discord, 스터디) 주 2회 이상 참여</span>
          </div>
        </div>

        <h2>면접에서 풀어낼 스토리</h2>
        <div class="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mt-6">
          <p><strong>질문:</strong> "좋은 개발자가 되기 위해 어떤 노력을 했나요?"</p>
          <p class="mt-3"><strong>답변:</strong></p>
          <p class="mt-2">"팀 문화의 중요성을 알지만, 혼자 일할 때도 그 가치를 놓치고 싶지 않았습니다. 그래서 6가지를 혼자 구현했습니다:</p>
          <ul class="mt-2 ml-4 space-y-2 list-disc">
            <li>매일 아침 5분 데일리 스크럼</li>
            <li>PR 후 하루 지나 본인 코드 리뷰</li>
            <li>주 1회 기술 글 정독 및 블로그 정리</li>
            <li>2주마다 KPT 회고</li>
            <li>프로젝트마다 문제 해결 과정 블로그화</li>
            <li>개발 커뮤니티 활동</li>
          </ul>
          <p class="mt-3">이를 1년 지속한 결과, GitHub에 40개의 커밋과 블로그에 20개의 글이 쌓였습니다. 무엇보다 제 약점을 명확히 알 수 있었고, 성장 궤적을 수치화할 수 있었습니다."</p>
        </div>

        <h2>마치며</h2>
        <p>혼자라고 해서 성장을 멈출 필요는 없습니다. 오히려 <strong>혼자만의 문화를 만드는 그 과정 자체가 포트폴리오</strong>입니다. 면접관이 당신의 GitHub와 블로그를 봤을 때, "아, 이 사람은 혼자서도 성장하려는 의지가 있구나"가 느껴지면 그게 가장 강력한 무기가 돼요.</p>
        <p class="mt-3">시작은 작게. 하지만 지속적으로.</p>
      </div>
    `,
  },
]

export function getBlogPostBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug)
}

export function getAllBlogPosts(): BlogPost[] {
  return blogPosts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

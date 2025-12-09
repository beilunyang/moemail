export interface BlogPost {
  slug: string
  title: string
  excerpt: string
  date: string
  content: string
}

type LocalizedBlogPosts = {
  [locale: string]: BlogPost[]
}

const blogPostsData: LocalizedBlogPosts = {
  en: [
    {
      slug: "why-use-moemail",
      title: "Why Use MoeMail Temporary Email?",
      excerpt: "Discover how MoeMail protects your privacy with a cute, fast, and completely free temporary email service built on modern technology.",
      date: "2024-12-10",
      content: `
        <h2>The Problem with Your Real Email</h2>
        <p>Every time you sign up for a newsletter, download an ebook, or try a new service, you hand over your email address. This often leads to:</p>
        <ul>
          <li>Endless spam and unwanted marketing emails</li>
          <li>Data breaches exposing your personal information</li>
          <li>Cross-site tracking and targeted advertising</li>
          <li>A cluttered inbox that's hard to manage</li>
        </ul>

        <h2>What is MoeMail?</h2>
        <p>MoeMail is a cute temporary email service built with Next.js and Cloudflare technology stack. It provides disposable email addresses that protect your real inbox from spam and unwanted messages. With MoeMail, you can create temporary email addresses instantly and receive emails in real-time.</p>

        <h2>Why Choose MoeMail?</h2>
        
        <h3>🔒 Privacy First</h3>
        <p>We don't track you. Your mailbox is protected by secure account authentication, ensuring only you have access. Unlike other services, we prioritize your privacy above all else.</p>

        <h3>⚡ Lightning Fast</h3>
        <p>Built on Cloudflare's global edge network, MoeMail delivers emails instantly. Our automatic polling system ensures you receive notifications in real-time without refreshing the page.</p>

        <h3>💰 Completely Free</h3>
        <p>MoeMail is open source and can be self-hosted on Cloudflare for free. No hidden costs, no premium tiers for basic features. Everything you need is available at no charge.</p>

        <h3>🌍 Multi-Language Support</h3>
        <p>MoeMail supports English, Simplified Chinese, Traditional Chinese, Japanese, and Korean. Use the service in your preferred language.</p>

        <h3>🔌 Developer Friendly</h3>
        <p>MoeMail provides a complete OpenAPI interface and webhook support. Integrate temporary email functionality into your applications with ease using our REST API.</p>

        <h3>📱 Modern Design</h3>
        <p>Enjoy a beautiful, responsive interface that works perfectly on desktop, tablet, and mobile devices. Dark mode is available for comfortable viewing at any time.</p>

        <h2>When to Use MoeMail</h2>
        <ul>
          <li>Signing up for one-time services or trials</li>
          <li>Downloading content that requires email verification</li>
          <li>Testing websites during development</li>
          <li>Protecting your identity on public forums</li>
          <li>Avoiding marketing emails from untrusted sources</li>
        </ul>

        <h2>Get Started Today</h2>
        <p>Join thousands of users who trust MoeMail to protect their privacy. Create your first temporary email address in seconds and experience the difference. Your real inbox will thank you!</p>
      `
    }
  ],
  "zh-CN": [
    {
      slug: "why-use-moemail",
      title: "为什么使用 MoeMail 临时邮箱？",
      excerpt: "了解 MoeMail 如何通过可爱、快速且完全免费的临时邮箱服务保护您的隐私，该服务基于现代技术构建。",
      date: "2024-12-10",
      content: `
        <h2>真实邮箱面临的问题</h2>
        <p>每次您注册新闻通讯、下载电子书或尝试新服务时，都会提供您的电子邮件地址。这通常会导致：</p>
        <ul>
          <li>无尽的垃圾邮件和不需要的营销邮件</li>
          <li>数据泄露暴露您的个人信息</li>
          <li>跨站点追踪和定向广告</li>
          <li>杂乱无章、难以管理的收件箱</li>
        </ul>

        <h2>什么是 MoeMail？</h2>
        <p>MoeMail 是一个基于 Next.js 和 Cloudflare 技术栈构建的可爱临时邮箱服务。它提供一次性电子邮件地址，保护您的真实收件箱免受垃圾邮件和不需要的消息的侵扰。使用 MoeMail，您可以即时创建临时邮箱地址并实时接收邮件。</p>

        <h2>为什么选择 MoeMail？</h2>
        
        <h3>🔒 隐私优先</h3>
        <p>我们不会追踪您。您的邮箱受到安全账户认证保护，确保只有您可以访问。与其他服务不同，我们将您的隐私放在首位。</p>

        <h3>⚡ 闪电般快速</h3>
        <p>基于 Cloudflare 的全球边缘网络构建，MoeMail 能够即时送达邮件。我们的自动轮询系统确保您无需刷新页面即可实时收到通知。</p>

        <h3>💰 完全免费</h3>
        <p>MoeMail 是开源的，可以在 Cloudflare 上免费自托管。没有隐藏费用，基本功能没有付费等级。您需要的一切都免费提供。</p>

        <h3>🌍 多语言支持</h3>
        <p>MoeMail 支持英语、简体中文、繁体中文、日语和韩语。使用您喜欢的语言享受服务。</p>

        <h3>🔌 对开发者友好</h3>
        <p>MoeMail 提供完整的 OpenAPI 接口和 Webhook 支持。使用我们的 REST API 轻松将临时邮箱功能集成到您的应用程序中。</p>

        <h3>📱 现代化设计</h3>
        <p>享受美观、响应式的界面，在桌面、平板和移动设备上都能完美运行。提供深色模式，随时舒适浏览。</p>

        <h2>何时使用 MoeMail</h2>
        <ul>
          <li>注册一次性服务或试用</li>
          <li>下载需要邮件验证的内容</li>
          <li>开发过程中测试网站</li>
          <li>在公共论坛保护您的身份</li>
          <li>避免来自不信任来源的营销邮件</li>
        </ul>

        <h2>立即开始</h2>
        <p>加入成千上万信任 MoeMail 保护隐私的用户。几秒钟内创建您的第一个临时邮箱地址，体验不同。您的真实收件箱会感谢您的！</p>
      `
    }
  ],
  "zh-TW": [
    {
      slug: "why-use-moemail",
      title: "為什麼使用 MoeMail 臨時郵箱？",
      excerpt: "了解 MoeMail 如何透過可愛、快速且完全免費的臨時郵箱服務保護您的隱私，該服務基於現代技術構建。",
      date: "2024-12-10",
      content: `
        <h2>真實郵箱面臨的問題</h2>
        <p>每次您註冊新聞通訊、下載電子書或嘗試新服務時，都會提供您的電子郵件地址。這通常會導致：</p>
        <ul>
          <li>無盡的垃圾郵件和不需要的行銷郵件</li>
          <li>資料洩露暴露您的個人資訊</li>
          <li>跨站點追蹤和定向廣告</li>
          <li>雜亂無章、難以管理的收件匣</li>
        </ul>

        <h2>什麼是 MoeMail？</h2>
        <p>MoeMail 是一個基於 Next.js 和 Cloudflare 技術棧構建的可愛臨時郵箱服務。它提供一次性電子郵件地址，保護您的真實收件匣免受垃圾郵件和不需要的訊息的侵擾。使用 MoeMail，您可以即時建立臨時郵箱地址並即時接收郵件。</p>

        <h2>為什麼選擇 MoeMail？</h2>
        
        <h3>🔒 隱私優先</h3>
        <p>我們不會追蹤您。您的郵箱受到安全帳戶認證保護，確保只有您可以存取。與其他服務不同，我們將您的隱私放在首位。</p>

        <h3>⚡ 閃電般快速</h3>
        <p>基於 Cloudflare 的全球邊緣網路構建，MoeMail 能夠即時送達郵件。我們的自動輪詢系統確保您無需重新整理頁面即可即時收到通知。</p>

        <h3>💰 完全免費</h3>
        <p>MoeMail 是開源的，可以在 Cloudflare 上免費自託管。沒有隱藏費用，基本功能沒有付費等級。您需要的一切都免費提供。</p>

        <h3>🌍 多語言支援</h3>
        <p>MoeMail 支援英語、簡體中文、繁體中文、日語和韓語。使用您喜歡的語言享受服務。</p>

        <h3>🔌 對開發者友好</h3>
        <p>MoeMail 提供完整的 OpenAPI 介面和 Webhook 支援。使用我們的 REST API 輕鬆將臨時郵箱功能整合到您的應用程式中。</p>

        <h3>📱 現代化設計</h3>
        <p>享受美觀、響應式的介面，在桌面、平板和行動裝置上都能完美運作。提供深色模式，隨時舒適瀏覽。</p>

        <h2>何時使用 MoeMail</h2>
        <ul>
          <li>註冊一次性服務或試用</li>
          <li>下載需要郵件驗證的內容</li>
          <li>開發過程中測試網站</li>
          <li>在公共論壇保護您的身份</li>
          <li>避免來自不信任來源的行銷郵件</li>
        </ul>

        <h2>立即開始</h2>
        <p>加入成千上萬信任 MoeMail 保護隱私的使用者。幾秒鐘內建立您的第一個臨時郵箱地址，體驗不同。您的真實收件匣會感謝您的！</p>
      `
    }
  ],
  ja: [
    {
      slug: "why-use-moemail",
      title: "なぜ MoeMail 一時メールを使うのか？",
      excerpt: "MoeMail がかわいく、高速で、完全無料の一時メールサービスでどのようにプライバシーを保護するかをご紹介します。",
      date: "2024-12-10",
      content: `
        <h2>本当のメールアドレスの問題</h2>
        <p>ニュースレターの登録、電子書籍のダウンロード、新しいサービスの試用のたびに、メールアドレスを提供します。これは次のような問題を引き起こします：</p>
        <ul>
          <li>終わりのないスパムと不要なマーケティングメール</li>
          <li>個人情報を露出するデータ侵害</li>
          <li>クロスサイトトラッキングとターゲット広告</li>
          <li>管理が難しい乱雑な受信トレイ</li>
        </ul>

        <h2>MoeMail とは？</h2>
        <p>MoeMail は Next.js と Cloudflare テクノロジースタックで構築されたかわいい一時メールサービスです。スパムや不要なメッセージから実際の受信トレイを保護する使い捨てメールアドレスを提供します。MoeMail を使えば、一時メールアドレスを即座に作成し、リアルタイムでメールを受信できます。</p>

        <h2>なぜ MoeMail を選ぶ？</h2>
        
        <h3>🔒 プライバシー第一</h3>
        <p>私たちはあなたを追跡しません。メールボックスは安全なアカウント認証で保護され、あなただけがアクセスできます。他のサービスとは異なり、私たちはあなたのプライバシーを最優先にします。</p>

        <h3>⚡ 超高速</h3>
        <p>Cloudflare のグローバルエッジネットワーク上に構築され、MoeMail は即座にメールを配信します。自動ポーリングシステムにより、ページを更新せずにリアルタイムで通知を受け取れます。</p>

        <h3>💰 完全無料</h3>
        <p>MoeMail はオープンソースで、Cloudflare 上で無料でセルフホスティングできます。隠れた費用なし、基本機能のプレミアムティアなし。必要なものすべてが無料で利用できます。</p>

        <h3>🌍 多言語サポート</h3>
        <p>MoeMail は英語、簡体字中国語、繁体字中国語、日本語、韓国語をサポートしています。お好みの言語でサービスをご利用ください。</p>

        <h3>🔌 開発者フレンドリー</h3>
        <p>MoeMail は完全な OpenAPI インターフェースと Webhook サポートを提供します。REST API を使用して、アプリケーションに一時メール機能を簡単に統合できます。</p>

        <h3>📱 モダンなデザイン</h3>
        <p>デスクトップ、タブレット、モバイルデバイスで完璧に動作する美しいレスポンシブインターフェースをお楽しみください。いつでも快適に閲覧できるダークモードも利用可能です。</p>

        <h2>MoeMail を使うタイミング</h2>
        <ul>
          <li>一回限りのサービスやトライアルへの登録</li>
          <li>メール認証が必要なコンテンツのダウンロード</li>
          <li>開発中のウェブサイトテスト</li>
          <li>公開フォーラムでの身元保護</li>
          <li>信頼できないソースからのマーケティングメール回避</li>
        </ul>

        <h2>今すぐ始めましょう</h2>
        <p>プライバシー保護に MoeMail を信頼する何千ものユーザーに参加しましょう。数秒で最初の一時メールアドレスを作成し、違いを体験してください。あなたの本当の受信トレイが感謝するでしょう！</p>
      `
    }
  ],
  ko: [
    {
      slug: "why-use-moemail",
      title: "왜 MoeMail 임시 이메일을 사용하나요?",
      excerpt: "MoeMail이 귀엽고 빠르며 완전 무료인 임시 이메일 서비스로 어떻게 개인정보를 보호하는지 알아보세요.",
      date: "2024-12-10",
      content: `
        <h2>실제 이메일의 문제점</h2>
        <p>뉴스레터 가입, 전자책 다운로드, 새로운 서비스 시도 시 매번 이메일 주소를 제공합니다. 이는 다음과 같은 문제를 일으킵니다:</p>
        <ul>
          <li>끝없는 스팸과 원치 않는 마케팅 이메일</li>
          <li>개인 정보를 노출하는 데이터 침해</li>
          <li>크로스 사이트 추적과 타겟 광고</li>
          <li>관리하기 어려운 복잡한 받은편지함</li>
        </ul>

        <h2>MoeMail이란?</h2>
        <p>MoeMail은 Next.js와 Cloudflare 기술 스택으로 구축된 귀여운 임시 이메일 서비스입니다. 스팸과 원치 않는 메시지로부터 실제 받은편지함을 보호하는 일회용 이메일 주소를 제공합니다. MoeMail을 사용하면 임시 이메일 주소를 즉시 만들고 실시간으로 이메일을 받을 수 있습니다.</p>

        <h2>왜 MoeMail을 선택하나요?</h2>
        
        <h3>🔒 개인정보 우선</h3>
        <p>저희는 귀하를 추적하지 않습니다. 메일함은 안전한 계정 인증으로 보호되어 오직 귀하만 접근할 수 있습니다. 다른 서비스와 달리 저희는 귀하의 개인정보를 최우선으로 합니다.</p>

        <h3>⚡ 초고속</h3>
        <p>Cloudflare의 글로벌 엣지 네트워크에 구축되어 MoeMail은 즉시 이메일을 전달합니다. 자동 폴링 시스템으로 페이지를 새로고침하지 않고도 실시간 알림을 받을 수 있습니다.</p>

        <h3>💰 완전 무료</h3>
        <p>MoeMail은 오픈소스이며 Cloudflare에서 무료로 셀프 호스팅할 수 있습니다. 숨겨진 비용 없음, 기본 기능에 대한 프리미엄 티어 없음. 필요한 모든 것이 무료로 제공됩니다.</p>

        <h3>🌍 다국어 지원</h3>
        <p>MoeMail은 영어, 중국어 간체, 중국어 번체, 일본어, 한국어를 지원합니다. 선호하는 언어로 서비스를 이용하세요.</p>

        <h3>🔌 개발자 친화적</h3>
        <p>MoeMail은 완전한 OpenAPI 인터페이스와 Webhook 지원을 제공합니다. REST API를 사용하여 애플리케이션에 임시 이메일 기능을 쉽게 통합하세요.</p>

        <h3>📱 현대적 디자인</h3>
        <p>데스크톱, 태블릿, 모바일 기기에서 완벽하게 작동하는 아름답고 반응형 인터페이스를 즐기세요. 언제든 편안하게 볼 수 있는 다크 모드도 제공됩니다.</p>

        <h2>MoeMail 사용 시기</h2>
        <ul>
          <li>일회성 서비스나 체험판 가입</li>
          <li>이메일 인증이 필요한 콘텐츠 다운로드</li>
          <li>개발 중 웹사이트 테스트</li>
          <li>공개 포럼에서 신원 보호</li>
          <li>신뢰할 수 없는 소스의 마케팅 이메일 회피</li>
        </ul>

        <h2>지금 시작하세요</h2>
        <p>개인정보 보호를 위해 MoeMail을 신뢰하는 수천 명의 사용자와 함께하세요. 몇 초 만에 첫 임시 이메일 주소를 만들고 차이를 경험하세요. 실제 받은편지함이 감사할 것입니다!</p>
      `
    }
  ]
}

export function getBlogPosts(locale: string = "en"): BlogPost[] {
  return blogPostsData[locale] || blogPostsData.en
}

export const blogPosts = blogPostsData.en // For backward compatibility

export function getBlogPost(slug: string, locale: string = "en"): BlogPost | undefined {
  const posts = getBlogPosts(locale)
  return posts.find((post) => post.slug === slug)
}

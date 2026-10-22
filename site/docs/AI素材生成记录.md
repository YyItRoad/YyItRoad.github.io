# AI 素材生成记录

日期：2026-10-22（北京时间）。方式：内置 image_gen 工具；用户明确要求“缺失的素材需要你自己根据 UI 生成”。下列均为重新生成的独立插画，不是历史确认图片或从 UI 效果图裁切出的素材。英文为实际提交的完整提示词，中文说明为归档注释。

## Banner

参考：仓库 `docs/design/知行合一个人导航仪表盘.png`，仅参考风格与构图。

原图：`../assets/images/source/hero-sunset-v1.png`；网页版本：`../assets/images/hero-sunset-v1.webp`。

```text
Use case: illustration-story. Asset type: production website hero background, standalone landscape artwork, wide 3:1 panoramic composition, ideally 2400x800 or similar. Input image is a REFERENCE ONLY: use the scenic illustrated banner at the top of the approved YangYang.fun UI reference as the visual direction, NOT an edit target and NOT a screenshot to reproduce. Generate a new independent, beautifully detailed anime-style digital painting of layered blue-violet alpine mountain ranges with snowy distant peaks, a calm blue lake reflecting a golden sunset, peach pink and lavender clouds, dark evergreen pine forests and warm amber wildflowers framing the foreground edges. A single young adult man with short dark hair wearing a dark navy outdoor jacket and a navy hiking backpack is CLEARLY SITTING on a rocky outcrop at the RIGHT (center of figure about 79% width), viewed from behind in three quarter view, thoughtfully looking toward the sunset near 65% width. Ensure convincingly seated anatomy, bent knees resting comfortably, backpack visible. Rich cinematic lighting, crisp brushwork and natural fine texture, sunset glow on the character and rocks, blue ambient shadows. Full bleed horizon landscape. The left 50 percent has quieter pale blue mountains and open peach sky so real HTML dark navy title can overlay legibly. Do not paint title or leave a blank solid text box. Keep main figure and rock clear enough for a right-aligned portrait crop on mobile. Constraints: landscape ONLY, absolutely NO text, letters, typography, logos, watermark, navigation, UI, search bars, buttons, cards, borders, collage, panels or infographic. This is an illustration asset, NOT a UI mockup.
```

## 关于我人物

参考：上述新生成的 Banner，保持虚构角色与绘画风格一致。

原图：`../assets/images/source/about-explorer-v1.png`；网页版本：`../assets/images/about-explorer-v1.webp`。圆形显示由 CSS 实现；并非站点所有者真实照片。

```text
Use case: illustration-story. Asset type: independent square portrait illustration for an about-me section of a personal website, NOT a UI image. Input reference 1 is the just-generated website landscape banner and establishes exact character and art direction. Generate a NEW separate close composition of the SAME young adult man from the reference: short tousled black hair, dark navy outdoor jacket with hood, a dark navy hiking backpack, seen from behind in 3/4 view, quietly seated looking at a warm sunset over a blue alpine lake and layered purple snowy mountains. Beautiful detailed anime digital painting matching the reference. Square 1:1 composition, head and upper torso occupy central 65% and are fully inside a circular safe area; enough environment around head for round cropping, warm peach rimlight, blue shadows, calm curious mood. Background fully painted scenery. No frontend elements, NO text, no letters, no logo, no watermark, no border, no badge, no frame, no circular mask, no collage. Final crop to a circle will be done in CSS. This is a fictional illustrated character and must not be described as a photo of the owner.
```

## 使用与派生

原始 PNG 按字节保留；WebP 只做格式转换和尺寸优化，未进行语义编辑。Banner 保留完整构图，手机通过 CSS object-position / background-position 响应式裁切；关于我原图缩小至 480 × 480。所有来源记录不包含登录信息或临时下载签名。

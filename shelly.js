// Shelly — the Super Sheldon AI companion overlay.
// Reads real numbers from window.db, performs real mutations, persists chat
// across pages, surfaces proactive nudges, and supports slash commands.
(function () {
  if (window.shelly) return;

  let panel, bubble, badge, list;
  let suggestionsEl, inputEl, sendEl;
  let opened = false;
  let proactiveTimer = null;
  let pageContext = {}; // { page, studentId, courseId }
  let pendingQuestion = null; // 'name' | 'tour-continue' | …
  let tourState = null;       // { steps, index, onDone }

  // ===== Avatars =====
  function shellyHeroSvg(size) {
    size = size || 80;
    const h = Math.round(size * 1.12);
    return '<svg width="' + size + '" height="' + h + '" viewBox="0 0 80 90" xmlns="http://www.w3.org/2000/svg" style="overflow:visible;">' +
      '<path d="M28 30 Q8 36 6 60 Q14 60 22 56 Q16 68 12 78 Q24 76 32 66 L40 50 Z" fill="#dc2626"/>' +
      '<path d="M52 30 Q72 36 74 60 Q66 60 58 56 Q64 68 68 78 Q56 76 48 66 L40 50 Z" fill="#dc2626"/>' +
      '<path d="M28 30 L52 30 L48 64 L40 68 L32 64 Z" fill="#991b1b"/>' +
      '<path d="M46 56 L50 76 L52 82 L46 82 L42 76 L40 60 Z" fill="#fde68a"/>' +
      '<path d="M40 78 L54 78 L54 84 L40 84 Z" fill="#1e3a8a"/>' +
      '<path d="M34 56 L30 76 L28 82 L34 82 L38 76 L40 60 Z" fill="#fde68a"/>' +
      '<path d="M26 78 L40 78 L40 84 L26 84 Z" fill="#1e3a8a"/>' +
      '<path d="M50 36 L56 50 L58 52 L56 54 L54 52 L48 42 Z" fill="#fde68a"/>' +
      '<path d="M28 34 Q28 30 34 28 L46 28 Q52 30 52 34 L51 56 Q49 60 40 60 Q31 60 29 56 Z" fill="#fafafa"/>' +
      '<path d="M30 30 L40 36 L50 30 L48 33 L40 38 L32 33 Z" fill="#dc2626"/>' +
      '<rect x="29" y="53" width="22" height="3.5" fill="#1e3a8a"/>' +
      '<rect x="38" y="52" width="4" height="6" fill="#fcd34d"/>' +
      '<circle cx="40" cy="44" r="6.5" fill="#fef3c7"/>' +
      '<text x="40" y="47" font-family="Arial Black,Inter,sans-serif" font-size="6.5" font-weight="900" fill="#dc2626" text-anchor="middle">S</text>' +
      '<path d="M30 34 L24 18 L21 11 L24 9 L28 14 L32 28 L34 36 Z" fill="#fde68a"/>' +
      '<circle cx="22.5" cy="10.5" r="4.5" fill="#dc2626"/>' +
      '<path d="M19 9 Q22.5 6 26 9" stroke="#7f1d1d" stroke-width="0.6" fill="none"/>' +
      '<circle cx="40" cy="22" r="9.5" fill="#fde68a"/>' +
      '<path d="M30 16 Q30 7 40 6 Q50 7 50 16 L50 24 L48 22 Q46 14 40 14 Q34 14 32 22 L30 24 Z" fill="#1e293b"/>' +
      '<ellipse cx="29" cy="20" rx="3.2" ry="5" fill="#1e293b"/>' +
      '<ellipse cx="51" cy="20" rx="3.2" ry="5" fill="#1e293b"/>' +
      '<circle cx="29" cy="24" r="1.4" fill="#fcd34d"/>' +
      '<circle cx="51" cy="24" r="1.4" fill="#fcd34d"/>' +
      '<path d="M32 16 Q34 10 40 9 Q46 10 48 16 Q46 13 42 12 Q40 14 39 14 Q38 14 36 12 Q34 13 32 16 Z" fill="#1e293b"/>' +
      '<path d="M33 17.5 L47 17.5 Q48 18 47.5 20.5 Q45 21.5 42 21 Q40 19.5 40 19.5 Q40 19.5 38 21 Q35 21.5 32.5 20.5 Q32 18 33 17.5 Z" fill="#dc2626"/>' +
      '<circle cx="35.5" cy="19.5" r="1.2" fill="#fff"/>' +
      '<circle cx="44.5" cy="19.5" r="1.2" fill="#fff"/>' +
      '<circle cx="35.6" cy="19.75" r="0.55" fill="#1a1a2e"/>' +
      '<circle cx="44.6" cy="19.75" r="0.55" fill="#1a1a2e"/>' +
      '<circle cx="35.85" cy="19.35" r="0.22" fill="#fff"/>' +
      '<circle cx="44.85" cy="19.35" r="0.22" fill="#fff"/>' +
      '<path d="M37.5 23.5 Q40 25 42.5 23.5" stroke="#7f1d1d" stroke-width="0.85" fill="none" stroke-linecap="round"/>' +
      '<circle cx="33.5" cy="23" r="1.1" fill="#fda4af" opacity="0.7"/>' +
      '<circle cx="46.5" cy="23" r="1.1" fill="#fda4af" opacity="0.7"/>' +
      '<path d="M14 36 L4 38" stroke="#fb7185" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/>' +
      '<path d="M20 46 L8 50" stroke="#fb7185" stroke-width="1.5" stroke-linecap="round" opacity="0.5"/>' +
      '</svg>';
  }

  function shellyHeadSvg(size) {
    size = size || 26;
    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">' +
      // hair back
      '<path d="M5 13 Q5 4 16 3 Q27 4 27 13 L27 20 L25 18 Q24 11 16 11 Q8 11 7 18 L5 20 Z" fill="#1e293b"/>' +
      // hair highlight
      '<path d="M10 7 Q13 5 16 5 Q19 5 22 7" stroke="#64748b" stroke-width="0.5" fill="none" opacity="0.6"/>' +
      // face
      '<circle cx="16" cy="14" r="8" fill="#fde68a"/>' +
      // pigtails
      '<ellipse cx="4" cy="14" rx="2.5" ry="4" fill="#1e293b"/>' +
      '<ellipse cx="28" cy="14" rx="2.5" ry="4" fill="#1e293b"/>' +
      '<circle cx="4" cy="17.5" r="1.1" fill="#fcd34d"/>' +
      '<circle cx="28" cy="17.5" r="1.1" fill="#fcd34d"/>' +
      // fringe
      '<path d="M9 10 Q11 5 16 4 Q21 5 23 10 Q21 8 18 7 Q17 9.5 16 9.5 Q15 9.5 14 7 Q11 8 9 10 Z" fill="#1e293b"/>' +
      // eyebrows (NEW — adds expression)
      '<path d="M10.5 12.2 Q11.5 11.5 12.8 12" stroke="#1e293b" stroke-width="0.7" fill="none" stroke-linecap="round"/>' +
      '<path d="M19.2 12 Q20.5 11.5 21.5 12.2" stroke="#1e293b" stroke-width="0.7" fill="none" stroke-linecap="round"/>' +
      // mask
      '<path d="M8 13 L24 13 Q25 13.5 24.5 15.8 Q22 16.8 19 16.2 Q17 14.8 16 14.8 Q15 14.8 13 16.2 Q10 16.8 7.5 15.8 Q7 13.5 8 13 Z" fill="#dc2626"/>' +
      // eye whites
      '<ellipse cx="11.5" cy="14.6" rx="1.3" ry="1.4" fill="#fff"/>' +
      '<ellipse cx="20.5" cy="14.6" rx="1.3" ry="1.4" fill="#fff"/>' +
      // iris (blue)
      '<circle cx="11.5" cy="14.85" r="0.85" fill="#1d4ed8"/>' +
      '<circle cx="20.5" cy="14.85" r="0.85" fill="#1d4ed8"/>' +
      // pupil
      '<circle cx="11.5" cy="14.85" r="0.45" fill="#0f172a"/>' +
      '<circle cx="20.5" cy="14.85" r="0.45" fill="#0f172a"/>' +
      // sparkle
      '<circle cx="11.85" cy="14.45" r="0.28" fill="#fff"/>' +
      '<circle cx="20.85" cy="14.45" r="0.28" fill="#fff"/>' +
      // nose hint
      '<path d="M16 17 Q15.7 17.7 16 18.2 Q16.3 17.7 16 17" fill="#f59e0b" opacity="0.4"/>' +
      // smile
      '<path d="M13.2 18.9 Q16 20.4 18.8 18.9" stroke="#7f1d1d" stroke-width="0.9" fill="none" stroke-linecap="round"/>' +
      // cheek blush
      '<ellipse cx="9" cy="17.6" rx="1.4" ry="0.9" fill="#fda4af" opacity="0.7"/>' +
      '<ellipse cx="23" cy="17.6" rx="1.4" ry="0.9" fill="#fda4af" opacity="0.7"/>' +
      '</svg>';
  }

  // Portrait avatar — distinctly different from the round head crop. Used in the
  // chat panel header so the "DP" feels like a real profile picture, not a tiny icon.
  // Larger viewBox, soft pink-purple-indigo gradient backdrop, more refined face
  // (bigger eyes with iris, eyebrows, nose, lip detail, blush, a sparkle).
  function shellyPortraitSvg(size) {
    size = size || 56;
    const gid = 'sp-' + Math.random().toString(36).slice(2, 8);
    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 72 72" xmlns="http://www.w3.org/2000/svg">' +
      '<defs>' +
        '<linearGradient id="' + gid + '" x1="0" y1="0" x2="1" y2="1">' +
          '<stop offset="0%" stop-color="#fbcfe8"/>' +
          '<stop offset="50%" stop-color="#e9d5ff"/>' +
          '<stop offset="100%" stop-color="#c7d2fe"/>' +
        '</linearGradient>' +
      '</defs>' +
      // backdrop (rounded card)
      '<rect width="72" height="72" rx="16" fill="url(#' + gid + ')"/>' +
      // sparkle decorations on backdrop
      '<text x="58" y="20" font-family="Arial,sans-serif" font-size="7" fill="#fcd34d" opacity="0.9">✦</text>' +
      '<text x="8" y="56" font-family="Arial,sans-serif" font-size="5" fill="#fff" opacity="0.7">✦</text>' +
      // distant cape peek behind shoulders
      '<path d="M10 56 Q4 64 12 72 L22 66 Z" fill="#dc2626" opacity="0.9"/>' +
      '<path d="M62 56 Q68 64 60 72 L50 66 Z" fill="#dc2626" opacity="0.9"/>' +
      // upper body / suit
      '<path d="M16 70 Q16 50 36 46 Q56 50 56 70 L56 72 L16 72 Z" fill="#fafafa"/>' +
      // red collar
      '<path d="M22 52 Q30 58 36 60 Q42 58 50 52 L46 60 L36 66 L26 60 Z" fill="#dc2626"/>' +
      // S emblem on chest
      '<circle cx="36" cy="66" r="4" fill="#fef3c7"/>' +
      '<text x="36" y="68.2" font-family="Arial Black,Inter,sans-serif" font-size="4.5" font-weight="900" fill="#dc2626" text-anchor="middle">S</text>' +
      // hair back layer
      '<path d="M14 34 Q14 12 36 10 Q58 12 58 34 L58 50 L54 46 Q52 30 36 30 Q20 30 18 46 L14 50 Z" fill="#1e293b"/>' +
      // hair highlight
      '<path d="M28 16 Q32 13 36 13 Q40 13 44 16" stroke="#64748b" stroke-width="0.9" fill="none" opacity="0.7"/>' +
      // neck
      '<rect x="32" y="42" width="8" height="6" fill="#fde68a"/>' +
      '<path d="M32 44 L40 44 L39 46 L33 46 Z" fill="#d97706" opacity="0.25"/>' +
      // face
      '<circle cx="36" cy="32" r="13" fill="#fde68a"/>' +
      // pigtails
      '<ellipse cx="12" cy="34" rx="4" ry="6.5" fill="#1e293b"/>' +
      '<ellipse cx="60" cy="34" rx="4" ry="6.5" fill="#1e293b"/>' +
      '<circle cx="12" cy="41" r="1.8" fill="#fcd34d"/>' +
      '<circle cx="60" cy="41" r="1.8" fill="#fcd34d"/>' +
      // fringe
      '<path d="M24 24 Q28 14 36 12 Q44 14 48 24 Q45 21 41 19 Q38 22 36 22 Q34 22 31 19 Q27 21 24 24 Z" fill="#1e293b"/>' +
      // eyebrows
      '<path d="M27 28.5 Q29.5 27 32 28" stroke="#1e293b" stroke-width="1" fill="none" stroke-linecap="round"/>' +
      '<path d="M40 28 Q42.5 27 45 28.5" stroke="#1e293b" stroke-width="1" fill="none" stroke-linecap="round"/>' +
      // mask
      '<path d="M24 30 L48 30 Q49 30.5 48.5 33.5 Q46 34.8 42 34 Q39 32 36 32 Q33 32 30 34 Q26 34.8 23.5 33.5 Q23 30.5 24 30 Z" fill="#dc2626"/>' +
      // bigger eyes with iris
      '<ellipse cx="30" cy="32" rx="2" ry="2.3" fill="#fff"/>' +
      '<ellipse cx="42" cy="32" rx="2" ry="2.3" fill="#fff"/>' +
      '<circle cx="30" cy="32.3" r="1.4" fill="#1d4ed8"/>' +
      '<circle cx="42" cy="32.3" r="1.4" fill="#1d4ed8"/>' +
      '<circle cx="30" cy="32.3" r="0.7" fill="#0f172a"/>' +
      '<circle cx="42" cy="32.3" r="0.7" fill="#0f172a"/>' +
      // sparkles in eyes
      '<circle cx="30.6" cy="31.6" r="0.45" fill="#fff"/>' +
      '<circle cx="42.6" cy="31.6" r="0.45" fill="#fff"/>' +
      '<circle cx="29.4" cy="32.9" r="0.2" fill="#fff" opacity="0.7"/>' +
      '<circle cx="41.4" cy="32.9" r="0.2" fill="#fff" opacity="0.7"/>' +
      // nose hint
      '<path d="M36 35 Q35.3 36.3 36 37 Q36.7 36.3 36 35" fill="#f59e0b" opacity="0.45"/>' +
      // smile
      '<path d="M31.5 39.5 Q36 41.5 40.5 39.5" stroke="#7f1d1d" stroke-width="1.1" fill="none" stroke-linecap="round"/>' +
      // lower lip
      '<path d="M33 40.5 Q36 41.2 39 40.5" stroke="#dc2626" stroke-width="0.5" fill="none" opacity="0.55"/>' +
      // cheek blush
      '<ellipse cx="26" cy="38" rx="2" ry="1.3" fill="#fda4af" opacity="0.7"/>' +
      '<ellipse cx="46" cy="38" rx="2" ry="1.3" fill="#fda4af" opacity="0.7"/>' +
      '</svg>';
  }

  function injectStyles() {
    const style = document.createElement('style');
    style.textContent = [
      '.shelly-bubble{position:fixed;bottom:18px;right:18px;background:none;border:none;padding:0;cursor:pointer;z-index:9998;display:block;font-family:Inter,sans-serif;animation:shelly-float 3.6s ease-in-out infinite;}',
      '.shelly-bubble svg{display:block;pointer-events:none;filter:drop-shadow(0 6px 10px rgba(124,58,237,0.45)) drop-shadow(0 2px 3px rgba(0,0,0,0.18));}',
      '.shelly-bubble:hover{transform:translateY(-4px) scale(1.06);}',
      '.shelly-bubble:active{transform:translateY(-1px) scale(1.02);}',
      '.shelly-bubble.pulse{animation:shelly-bounce 1s ease 2,shelly-float 3.6s ease-in-out infinite 2s;}',
      '@keyframes shelly-float{0%,100%{transform:translateY(0);}50%{transform:translateY(-6px);}}',
      '@keyframes shelly-bounce{0%,100%{transform:translateY(0) scale(1);}50%{transform:translateY(-12px) scale(1.08);}}',
      '.shelly-badge{position:absolute;top:4px;right:-4px;min-width:20px;height:20px;border-radius:99px;background:#ef4444;color:#fff;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;padding:0 6px;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.2);z-index:2;}',
      '.shelly-panel{position:fixed;bottom:120px;right:20px;width:380px;max-width:calc(100vw - 28px);height:540px;max-height:calc(100vh - 140px);background:#fff;border-radius:18px;box-shadow:0 24px 64px rgba(0,0,0,0.22);display:flex;flex-direction:column;z-index:9999;overflow:hidden;font-family:Inter,sans-serif;transform-origin:bottom right;animation:shelly-pop 200ms ease;}',
      '@keyframes shelly-pop{from{opacity:0;transform:scale(0.92) translateY(8px);}to{opacity:1;transform:scale(1) translateY(0);}}',
      '.shelly-panel.hidden{display:none;}',
      '.shelly-hdr{padding:14px 16px;background:linear-gradient(135deg,#7c3aed,#2563eb);color:#fff;display:flex;align-items:center;gap:10px;}',
      '.shelly-hdr-avatar{width:46px;height:46px;border-radius:12px;display:flex;align-items:center;justify-content:center;border:2.5px solid #fff;flex-shrink:0;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.15);}',
      '.shelly-hdr-info{flex:1;min-width:0;}',
      '.shelly-hdr-info h4{font-size:14px;font-weight:700;margin:0;}',
      '.shelly-hdr-info p{font-size:11px;opacity:0.9;margin:2px 0 0;display:flex;align-items:center;gap:5px;}',
      '.shelly-dot{width:7px;height:7px;border-radius:50%;background:#34d399;display:inline-block;}',
      '.shelly-menu-btn{color:#fff;font-size:14px;line-height:1;cursor:pointer;background:none;border:none;padding:0;width:26px;height:26px;display:flex;align-items:center;justify-content:center;border-radius:6px;}',
      '.shelly-menu-btn:hover{background:rgba(255,255,255,0.15);}',
      '.shelly-list{flex:1;overflow-y:auto;padding:14px;background:#f9fafb;display:flex;flex-direction:column;gap:12px;}',
      '.shelly-list::-webkit-scrollbar{width:6px;}.shelly-list::-webkit-scrollbar-thumb{background:#d1d5db;border-radius:99px;}',
      '.shelly-msg{display:flex;gap:8px;align-items:flex-start;animation:shelly-fade 280ms ease;}',
      '@keyframes shelly-fade{from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:translateY(0);}}',
      '.shelly-msg-avatar{width:30px;height:30px;border-radius:50%;background:radial-gradient(circle at 30% 30%,#fce7f3,#f5d0fe);color:#fff;display:flex;align-items:center;justify-content:center;flex-shrink:0;border:1.5px solid #fff;box-shadow:0 1px 4px rgba(124,58,237,0.18);overflow:hidden;}',
      '.shelly-msg-body{max-width:260px;}',
      '.shelly-bubble-text{background:#fff;border:1px solid #e5e7eb;border-radius:14px;border-top-left-radius:4px;padding:10px 13px;font-size:13px;color:#1a1a2e;line-height:1.5;}',
      '.shelly-actions{display:flex;gap:6px;margin-top:8px;flex-wrap:wrap;}',
      '.shelly-action{padding:6px 12px;border-radius:99px;border:1px solid #c4b5fd;background:#f5f3ff;color:#5b21b6;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;transition:all 150ms;}',
      '.shelly-action:hover{background:#ede9fe;border-color:#a78bfa;}',
      '.shelly-action.primary{background:linear-gradient(135deg,#7c3aed,#2563eb);color:#fff;border-color:transparent;}',
      '.shelly-action.primary:hover{filter:brightness(1.08);}',
      '.shelly-typing{display:flex;gap:4px;padding:10px 13px;background:#fff;border:1px solid #e5e7eb;border-radius:14px;border-top-left-radius:4px;width:fit-content;}',
      '.shelly-typing span{width:6px;height:6px;border-radius:50%;background:#9ca3af;animation:shelly-bob 0.9s infinite ease-in-out;}',
      '.shelly-typing span:nth-child(2){animation-delay:0.15s;}',
      '.shelly-typing span:nth-child(3){animation-delay:0.3s;}',
      '@keyframes shelly-bob{0%,80%,100%{transform:translateY(0);opacity:0.4;}40%{transform:translateY(-4px);opacity:1;}}',
      '.shelly-suggestions{display:flex;gap:6px;padding:8px 14px 0;background:#fff;border-top:1px solid #e5e7eb;flex-wrap:wrap;}',
      '.shelly-chip{padding:5px 10px;border-radius:99px;border:1px solid #e5e7eb;background:#f9fafb;color:#374151;font-size:11.5px;font-weight:500;cursor:pointer;font-family:inherit;}',
      '.shelly-chip:hover{background:#f3f4f6;border-color:#c4b5fd;color:#5b21b6;}',
      '.shelly-compose{display:flex;gap:8px;padding:10px 14px;background:#fff;border-top:1px solid #e5e7eb;align-items:center;}',
      '.shelly-input{flex:1;border:1.5px solid #e5e7eb;border-radius:99px;padding:8px 14px;font-size:13px;outline:none;background:#f9fafb;transition:all 150ms;font-family:inherit;color:#1a1a2e;}',
      '.shelly-input:focus{border-color:#7c3aed;background:#fff;}',
      '.shelly-send{width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,#7c3aed,#2563eb);color:#fff;display:flex;align-items:center;justify-content:center;border:none;cursor:pointer;flex-shrink:0;transition:transform 150ms;}',
      '.shelly-send:hover{transform:scale(1.06);}',
      '.shelly-msg.user{justify-content:flex-end;}',
      '.shelly-msg.user .shelly-msg-avatar{order:2;background:#1e2130;}',
      '.shelly-msg.user .shelly-msg-body{order:1;}',
      '.shelly-msg.user .shelly-bubble-text{background:linear-gradient(135deg,#7c3aed,#2563eb);color:#fff;border-color:transparent;border-radius:14px;border-top-right-radius:4px;border-top-left-radius:14px;}',
      '.shelly-menu{position:absolute;top:50px;right:12px;background:#fff;border:1px solid #e5e7eb;border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,0.12);padding:6px;z-index:10000;min-width:170px;font-size:13px;}',
      '.shelly-menu button{display:flex;align-items:center;gap:8px;width:100%;padding:8px 10px;border:none;background:none;border-radius:6px;cursor:pointer;font:inherit;color:#1a1a2e;text-align:left;}',
      '.shelly-menu button:hover{background:#f3f4f6;}',
      '.shelly-menu button.danger{color:#dc2626;}',
      // Tour spotlight
      '.shelly-tour-backdrop{position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:10000;pointer-events:auto;transition:opacity 220ms;}',
      '.shelly-tour-spot{position:fixed;border-radius:10px;box-shadow:0 0 0 9999px rgba(0,0,0,0.55),0 0 0 4px #c4b5fd,0 0 30px rgba(124,58,237,0.6);z-index:10001;pointer-events:none;transition:all 300ms cubic-bezier(0.4,0,0.2,1);}',
      '.shelly-tour-tt{position:fixed;background:#fff;border-radius:14px;padding:18px;width:300px;max-width:calc(100vw - 32px);box-shadow:0 20px 60px rgba(0,0,0,0.3);z-index:10002;font-family:Inter,sans-serif;animation:shelly-pop 220ms ease;}',
      '.shelly-tour-tt .head{display:flex;align-items:center;gap:10px;margin-bottom:10px;}',
      '.shelly-tour-tt .head .av{width:34px;height:34px;border-radius:50%;background:radial-gradient(circle at 30% 30%,#fce7f3,#e9d5ff);overflow:hidden;flex-shrink:0;}',
      '.shelly-tour-tt .head h4{font-size:14px;font-weight:700;}',
      '.shelly-tour-tt .head p{font-size:11px;color:#6b7280;}',
      '.shelly-tour-tt .body{font-size:13px;color:#1a1a2e;line-height:1.5;margin-bottom:14px;}',
      '.shelly-tour-tt .ft{display:flex;align-items:center;justify-content:space-between;gap:8px;}',
      '.shelly-tour-tt .ft .progress{font-size:11px;color:#9ca3af;font-weight:600;}',
      '.shelly-tour-tt .ft .btns{display:flex;gap:6px;}',
      '.shelly-tour-tt button{padding:6px 14px;border-radius:99px;font-size:12px;font-weight:600;border:none;cursor:pointer;font-family:inherit;}',
      '.shelly-tour-tt .skip{background:none;color:#6b7280;}',
      '.shelly-tour-tt .skip:hover{background:#f3f4f6;}',
      '.shelly-tour-tt .next{background:linear-gradient(135deg,#7c3aed,#2563eb);color:#fff;}',
      '.shelly-tour-tt .next:hover{filter:brightness(1.08);}',
    ].join('\n');
    document.head.appendChild(style);
  }

  function build() {
    bubble = document.createElement('button');
    bubble.type = 'button';
    bubble.className = 'shelly-bubble';
    bubble.setAttribute('aria-label', 'Open Shelly');
    bubble.innerHTML = shellyHeroSvg(82);
    badge = document.createElement('span');
    badge.className = 'shelly-badge';
    badge.style.display = 'none';
    bubble.appendChild(badge);
    document.body.appendChild(bubble);

    panel = document.createElement('div');
    panel.className = 'shelly-panel hidden';
    panel.innerHTML =
      '<div class="shelly-hdr">' +
        '<div class="shelly-hdr-avatar">' + shellyPortraitSvg(42) + '</div>' +
        '<div class="shelly-hdr-info"><h4>Shelly the Super</h4><p><span class="shelly-dot"></span><span id="shelly-status">always on, here to help</span></p></div>' +
        '<button class="shelly-menu-btn" id="shelly-menu-btn" type="button" aria-label="Menu">⋮</button>' +
        '<button class="shelly-menu-btn" id="shelly-close" type="button" aria-label="Close">×</button>' +
      '</div>' +
      '<div class="shelly-list"></div>' +
      '<div class="shelly-suggestions"></div>' +
      '<div class="shelly-compose">' +
        '<input class="shelly-input" type="text" placeholder="Ask Shelly anything… (try /help)" />' +
        '<button class="shelly-send" type="button" aria-label="Send">' +
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>' +
        '</button>' +
      '</div>';
    document.body.appendChild(panel);
    list = panel.querySelector('.shelly-list');
    suggestionsEl = panel.querySelector('.shelly-suggestions');
    inputEl = panel.querySelector('.shelly-input');
    sendEl = panel.querySelector('.shelly-send');

    bubble.addEventListener('click', toggle);
    panel.querySelector('#shelly-close').addEventListener('click', toggle);
    panel.querySelector('#shelly-menu-btn').addEventListener('click', toggleMenu);
    sendEl.addEventListener('click', submitInput);
    inputEl.addEventListener('keydown', function (e) { if (e.key === 'Enter') submitInput(); });

    renderSuggestions([
      'How many credits left?',
      "Who's at risk?",
      "What's on today?",
      '/help',
    ]);
    restoreConversation();
    updateBadge();
  }

  function toggleMenu() {
    let menu = document.querySelector('.shelly-menu');
    if (menu) { menu.remove(); return; }
    menu = document.createElement('div');
    menu.className = 'shelly-menu';
    menu.innerHTML =
      '<button id="sh-clear" type="button">🧹 Clear conversation</button>' +
      '<button id="sh-reset" class="danger" type="button">♻️ Reset demo data</button>';
    panel.appendChild(menu);
    menu.querySelector('#sh-clear').addEventListener('click', function () { menu.remove(); window.db && db.shellyClear(); list.innerHTML = ''; say('Cleared! Fresh slate. ✨', { instant: true }); });
    menu.querySelector('#sh-reset').addEventListener('click', function () {
      menu.remove();
      if (confirm('Reset all demo data to the seed?\n\nAny edits you\'ve made (added students, top-ups, sent chats) will be wiped.')) {
        window.db && db.reset();
        say('All reset! 🦸‍♀️ Demo data is back to factory fresh. Reloading…', { instant: true });
        setTimeout(function () { window.location.reload(); }, 900);
      }
    });
    setTimeout(function () {
      const close = function (ev) { if (!menu.contains(ev.target)) { menu.remove(); document.removeEventListener('click', close); } };
      document.addEventListener('click', close);
    }, 0);
  }

  function unread() { return JSON.parse(sessionStorage.getItem('shelly_unread') || '0'); }
  function setUnread(n) { sessionStorage.setItem('shelly_unread', JSON.stringify(n)); }
  function updateBadge() { const n = unread(); if (n > 0 && !opened) { badge.textContent = n; badge.style.display = 'flex'; } else { badge.style.display = 'none'; } }

  function renderMessage(m, persist) {
    const div = document.createElement('div');
    div.className = 'shelly-msg' + (m.from === 'user' ? ' user' : '');
    const userAvatar = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';
    const avatar = m.from === 'user'
      ? '<div class="shelly-msg-avatar">' + userAvatar + '</div>'
      : '<div class="shelly-msg-avatar">' + shellyHeadSvg(26) + '</div>';
    const actionsHtml = (m.actions && m.actions.length)
      ? '<div class="shelly-actions">' + m.actions.map(function (a, i) {
          return '<button class="shelly-action ' + (a.primary ? 'primary' : '') + '" data-i="' + i + '" type="button">' + a.label + '</button>';
        }).join('') + '</div>'
      : '';
    const text = m.from === 'user' ? escapeHtml(m.text) : m.text;
    div.innerHTML = avatar + '<div class="shelly-msg-body"><div class="shelly-bubble-text">' + text + '</div>' + actionsHtml + '</div>';
    if (m.actions) {
      m.actions.forEach(function (a, i) {
        const btn = div.querySelector('[data-i="' + i + '"]');
        btn.addEventListener('click', function () {
          const wrap = div.querySelector('.shelly-actions');
          if (wrap) wrap.remove();
          if (typeof a.onClick === 'function') a.onClick();
          else if (a.action) handleAction(a.action, a.args);
        });
      });
    }
    list.appendChild(div);
    list.scrollTop = list.scrollHeight;
    if (persist && window.db) db.shellyAppend({ from: m.from, text: m.text });
  }

  function escapeHtml(s) { return String(s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }

  function showTyping() {
    const t = document.createElement('div');
    t.className = 'shelly-msg shelly-typing-wrap';
    t.innerHTML = '<div class="shelly-msg-avatar">' + shellyHeadSvg(26) + '</div><div class="shelly-typing"><span></span><span></span><span></span></div>';
    list.appendChild(t);
    list.scrollTop = list.scrollHeight;
    return t;
  }

  function toggle() {
    opened = !opened;
    panel.classList.toggle('hidden', !opened);
    if (opened) { setUnread(0); updateBadge(); }
  }
  function open()  { if (!opened) toggle(); }
  function close() { if (opened) toggle(); }

  // ===== Restore persistent conversation =====
  function restoreConversation() {
    if (!window.db) return;
    const past = db.get().shellyChat || [];
    past.forEach(function (m) { renderMessage({ from: m.from, text: m.text }, false); });
  }

  function renderSuggestions(arr) {
    if (!suggestionsEl) return;
    suggestionsEl.innerHTML = '';
    (arr || []).forEach(function (s) {
      const c = document.createElement('button');
      c.type = 'button';
      c.className = 'shelly-chip';
      c.textContent = s;
      c.addEventListener('click', function () { ask(s); });
      suggestionsEl.appendChild(c);
    });
  }

  // ===== Multi-turn flow state =====
  // pendingFlow = { type: 'schedule-when', handler: (input) => void, data: {…} }
  let pendingFlow = null;
  function clearFlow() { pendingFlow = null; }
  function isCancel(input) { return /^(cancel|stop|nevermind|never mind|forget it|exit)$/i.test(input.trim()); }

  function submitInput() {
    const v = inputEl.value.trim();
    if (!v) return;
    inputEl.value = '';

    // Pending name from onboarding (single-shot)
    if (pendingQuestion === 'name') {
      pendingQuestion = null;
      renderUserMessage(v);
      const name = v.split(/\s+/)[0].replace(/[^a-zA-Z' -]/g, '') || 'Teach';
      if (window.db) db.setMyName(v);
      say("Nice to meet you, <strong>" + name + "</strong>! 🌟 Let me give you a quick tour of your Super Sheldon command centre. Ready?", {
        delay: 600,
        actions: [
          { label: "Let's go! 🚀", primary: true, onClick: function () { startOnboardingTour(); } },
          { label: 'Skip the tour', onClick: function () { if (window.db) db.completeOnboarding(); say("All good! I'm always here in the bottom-right if you need me. Try <code>/help</code> any time. 💜"); } },
        ],
      });
      return;
    }

    // Multi-turn flow takes priority over routing
    if (pendingFlow) {
      renderUserMessage(v);
      if (isCancel(v)) { clearFlow(); say('Cancelled. 👍'); return; }
      const h = pendingFlow.handler;
      pendingFlow = null;
      h(v);
      return;
    }

    ask(v);
  }

  // ===== Natural date parsing =====
  // Accepts: today, tomorrow, mon/tue/.../sun, fri 6pm, tomorrow 5:30pm, 18:30, 6pm
  function parseDate(input) {
    if (!input) return null;
    const s = input.toLowerCase().trim();
    const now = new Date();
    let base = new Date(now);
    base.setSeconds(0); base.setMilliseconds(0);
    let dateMatched = false;
    if (/today|tonight/.test(s)) { dateMatched = true; }
    else if (/tomorrow/.test(s)) { base.setDate(now.getDate() + 1); dateMatched = true; }
    else {
      const days = ['sun','mon','tue','wed','thu','fri','sat'];
      const dayLong = { sunday:0,monday:1,tuesday:2,wednesday:3,thursday:4,friday:5,saturday:6 };
      let target = -1;
      for (let i = 0; i < days.length; i++) if (new RegExp('\\b'+days[i]+'\\b').test(s)) { target = i; break; }
      if (target < 0) for (const k in dayLong) if (s.indexOf(k) >= 0) { target = dayLong[k]; break; }
      if (target >= 0) { const diff = (target - now.getDay() + 7) % 7 || 7; base.setDate(now.getDate() + diff); dateMatched = true; }
    }
    // Time
    const tm = s.match(/(\d{1,2})(?:[:.](\d{2}))?\s*(am|pm)?/);
    if (tm) {
      let h = parseInt(tm[1]);
      const mins = parseInt(tm[2] || '0');
      const ampm = tm[3];
      if (ampm === 'pm' && h < 12) h += 12;
      else if (ampm === 'am' && h === 12) h = 0;
      else if (!ampm && h >= 1 && h <= 7) h += 12; // common shorthand for evening
      base.setHours(h, mins, 0, 0);
    } else if (dateMatched) {
      base.setHours(18, 30, 0, 0);
    } else {
      return null;
    }
    if (base.getTime() < now.getTime() && !/today|tonight/.test(s)) {
      base.setDate(base.getDate() + 1);
    }
    return base;
  }

  // Parse "in 5 min", "in 2 hours", "in 30s"
  function parseRelative(s) {
    const m = s.match(/in\s+(\d+)\s*(s|sec|seconds?|m|min|mins|minutes?|h|hr|hours?|d|days?)/i);
    if (!m) return null;
    const n = parseInt(m[1]);
    const unit = m[2].toLowerCase();
    const ms = unit.startsWith('s') ? n*1000 : unit.startsWith('m')||unit==='min'||unit==='mins'||unit==='minute'||unit==='minutes' ? n*60000 : unit.startsWith('h') ? n*3600000 : unit.startsWith('d') ? n*86400000 : 0;
    if (!ms) return null;
    return new Date(Date.now() + ms);
  }

  // ===== Multi-turn schedule flow =====
  function startScheduleFlow(seedStudent) {
    if (seedStudent) return askWhen(seedStudent);
    open();
    const students = db.students();
    say("Let's get a session on the books! 📅 Which learner?", {
      actions: students.slice(0, 4).map(function (st) {
        return { label: st.name, onClick: function () { askWhen(st); } };
      }).concat([{ label: 'Type a name', onClick: function () {
        say('Type the learner\'s name (or part of it). Say <code>cancel</code> to bail.');
        pendingFlow = { type: 'schedule-student', handler: function (input) {
          const found = db.get().users.find(function (u) { return u.role === 'student' && u.name.toLowerCase().indexOf(input.toLowerCase()) >= 0; });
          if (!found) { say("Couldn't find a learner matching <em>" + escapeHtml(input) + "</em>. Try again or say <code>cancel</code>."); pendingFlow = arguments.callee.parent; return; }
          askWhen(found);
        }};
      } }]),
    });
  }
  function askWhen(student) {
    const todayAt = function (h, m) { const d = new Date(); d.setHours(h, m||0, 0, 0); return d; };
    const tomorrowAt = function (h, m) { const d = new Date(); d.setDate(d.getDate()+1); d.setHours(h, m||0, 0, 0); return d; };
    const satAt = function (h, m) { const d = new Date(); const diff = (6 - d.getDay() + 7) % 7 || 7; d.setDate(d.getDate()+diff); d.setHours(h, m||0, 0, 0); return d; };
    say("Got it — for <strong>" + student.name + "</strong>. When? Pick a quick slot, or type something like <em>tomorrow 6pm</em>.", {
      actions: [
        { label: 'Today 6:30 PM', primary: true, onClick: function () { confirmSchedule(student, todayAt(18, 30)); } },
        { label: 'Tomorrow 5 PM', onClick: function () { confirmSchedule(student, tomorrowAt(17, 0)); } },
        { label: 'Saturday 11 AM', onClick: function () { confirmSchedule(student, satAt(11, 0)); } },
      ],
    });
    pendingFlow = { type: 'schedule-when', handler: function (input) {
      const dt = parseDate(input);
      if (!dt) { say("Couldn't parse that time. Try <em>tomorrow 6pm</em>, <em>fri 5</em>, or <em>tomorrow</em>."); pendingFlow = { type: 'schedule-when', handler: arguments.callee, data: { student: student } }; return; }
      confirmSchedule(student, dt);
    }, data: { student: student } };
  }
  function confirmSchedule(student, when) {
    pendingFlow = null;
    const d = db.get();
    const course = d.courses.find(function (c) { return (c.studentIds || []).indexOf(student.id) >= 0; });
    if (!course) { say("I couldn't find an active course for " + student.name + ". Create one first from <em>Courses</em>."); return; }
    db.scheduleSession(course.id, when.toISOString());
    say('Booked! ✅ <strong>' + student.name + '</strong> on <em>' + when.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) + '</em>. The parent will be notified.');
  }

  // ===== Multi-turn draft flow =====
  function startDraftFlow(seedName) {
    open();
    const chats = db.get().chats;
    if (!chats.length) { say('No chats yet to draft into.'); return; }
    const matchByName = function (name) {
      const q = (name||'').toLowerCase().trim();
      return chats.find(function (ch) { const u = db.findUser(ch.userId); return u && u.name.toLowerCase().indexOf(q) >= 0; });
    };
    const target = seedName ? matchByName(seedName) : null;
    if (target) return draftAskTone(target);
    say('Draft a reply to whom?', {
      actions: chats.slice(0, 4).map(function (ch) { const u = db.findUser(ch.userId); return { label: u ? u.name : 'Chat', onClick: function () { draftAskTone(ch); } }; }),
    });
    pendingFlow = { type: 'draft-who', handler: function (input) {
      const found = matchByName(input);
      if (!found) { say("Couldn't find that chat. Try again or <code>cancel</code>."); pendingFlow = { type: 'draft-who', handler: arguments.callee }; return; }
      draftAskTone(found);
    }};
  }
  function draftAskTone(chat) {
    const u = db.findUser(chat.userId);
    const last = chat.messages[chat.messages.length - 1] || {};
    say("Drafting for <strong>" + (u ? u.name : 'them') + "</strong>. Their last message: <em>“" + escapeHtml(last.text || '').slice(0, 80) + "”</em><br>What tone?", {
      actions: [
        { label: 'Warm + agree', primary: true, onClick: function () { draftReply(chat, 'warm'); } },
        { label: 'Brief + decline', onClick: function () { draftReply(chat, 'decline'); } },
        { label: 'Apologetic', onClick: function () { draftReply(chat, 'apology'); } },
      ],
    });
  }
  function draftReply(chat, tone) {
    const u = db.findUser(chat.userId);
    const first = (u && u.name.split(' ')[0]) || 'there';
    const last = chat.messages[chat.messages.length - 1] || {};
    let draft = '';
    if (tone === 'warm') {
      if (/shift|move|reschedul/i.test(last.text || '')) draft = 'Hi ' + first + ' — totally fine, I can shift Friday\'s session to 7:30 PM. Confirming on my end now. ✅';
      else if (/credit|top.?up|paid/i.test(last.text || '')) draft = 'Hi ' + first + ' — confirmed, the credits reflect on my end. Thanks so much! 💜';
      else draft = 'Hi ' + first + ' — got it, I\'m on it. Will follow up shortly. 🌟';
    } else if (tone === 'decline') {
      draft = 'Hi ' + first + ' — unfortunately that slot doesn\'t work this week. Could we try the same time next week?';
    } else {
      draft = 'Hi ' + first + ' — apologies for the delay! Let me sort this out and circle back today.';
    }
    say('Here\'s a draft:<br><br>“' + escapeHtml(draft) + '”', {
      actions: [
        { label: 'Send it', primary: true, onClick: function () { db.sendMessage(chat.id, draft); say('Sent ✅'); } },
        { label: 'Open in Chats', onClick: function () { window.location.href = '14-chats.html'; } },
        { label: 'Rewrite', onClick: function () { draftAskTone(chat); } },
      ],
    });
  }

  // ===== Daily summary card =====
  function buildSummary() {
    const d = db.get();
    const upcoming = db.upcoming();
    const today = new Date(); today.setHours(0,0,0,0);
    const tmrw = new Date(today); tmrw.setDate(today.getDate()+1);
    const todays = upcoming.filter(function (s) { const t = new Date(s.startsAt); return t >= today && t < tmrw; });
    const next = upcoming[0];
    const unreadChats = db.unreadChatCount();
    const unreadNotifs = db.unreadNotifCount();
    const atRisk = db.atRisk();
    const credits = d.credits.balance;
    const lines = [];
    lines.push('<strong>📅 ' + todays.length + ' session(s) today</strong>' + (next ? ' · next: <em>' + new Date(next.startsAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) + ' ' + ((db.findUser((next.studentIds||[])[0])||{}).name || '') + '</em>' : ''));
    lines.push('<strong>💬 ' + unreadChats + ' unread chat(s)</strong>' + (unreadChats ? ' · latest from ' + ((db.findUser((db.unreadChats()[0]||{}).userId)||{}).name || '—') : ''));
    lines.push('<strong>🔔 ' + unreadNotifs + ' notification(s)</strong>');
    lines.push('<strong>⚠️ ' + atRisk.length + ' at-risk learner(s)</strong>' + (atRisk.length ? ': ' + atRisk.slice(0,2).map(function (s){return s.name;}).join(', ') : ''));
    lines.push('<strong>💳 ' + credits + ' credits</strong>' + (credits < 15 ? ' (low ⚠️)' : ''));
    return lines.join('<br>');
  }
  function showSummary() {
    say('Here\'s your snapshot:<br><br>' + buildSummary(), {
      actions: [
        { label: 'Open Chats', onClick: function () { window.location.href = '14-chats.html'; } },
        { label: 'Open Progress', onClick: function () { window.location.href = '13-progress-reports.html'; } },
        { label: 'Open Notifications', onClick: function () { window.location.href = '17-notifications.html'; } },
      ],
    });
  }

  // ===== Templates library =====
  const TEMPLATES = {
    welcome:  "Hi! 🌟 So excited to start working with {student}. We'll kick off with a quick learning-style chat in our first session. If you ever have questions, this app is the fastest way to reach me!",
    recap:    "Quick recap of today's session with {student}:\n• Covered: [topic]\n• What clicked: [aha moment]\n• To practice: [one short exercise]\n\nNext session: same time next week!",
    missed:   "Hi! Just noticed {student} missed today's session — all okay? Happy to reschedule for the weekend if that's easier.",
    topup:    "Heads up — {student}'s credit balance is running low. You can top up from the Super Sheldon app anytime, takes 2 minutes.",
    feedback: "Hi! Would love your honest take on how {student} is finding our sessions. Anything I should change up? Always open to ideas. 💜",
    welcome_student: "Hey {student}! 🌟 Pumped to start learning together. I'll see you in our first session — bring questions and energy!",
  };
  function applyTemplate(key, student, parent) {
    const tpl = TEMPLATES[key];
    if (!tpl) return null;
    return tpl.replace(/\{student\}/g, (student && student.name) || '[Student]').replace(/\{parent\}/g, parent || '[Parent]');
  }

  // ===== Reminder scheduler =====
  function checkReminders() {
    if (!window.db) return;
    const now = Date.now();
    db.get().shellyReminders.filter(function (r) { return !r.fired && new Date(r.dueAt).getTime() <= now; }).forEach(function (r) {
      db.fireReminder(r.id);
      say('⏰ Reminder: <strong>' + escapeHtml(r.text) + '</strong>', { actions: [{ label: 'Dismiss' }, { label: 'Snooze 10 min', onClick: function () { db.addReminder(r.text, new Date(Date.now()+600000).toISOString()); say('Snoozed for 10 minutes. 💤'); } }] });
    });
  }

  // ===== Quick calculator =====
  function quickCalc(expr) {
    const safe = String(expr || '').replace(/[^0-9+\-*/.() ]/g, '');
    if (!safe) return null;
    try {
      const result = Function('"use strict"; return (' + safe + ')')();
      if (typeof result === 'number' && isFinite(result)) return result;
    } catch (e) {}
    return null;
  }

  // ===== Public API =====
  // Typing delay scales with reply length — humans take a beat for long messages.
  function typingDelay(text) {
    if (!text) return 500;
    const plain = String(text).replace(/<[^>]+>/g, '');
    return Math.min(2200, 380 + plain.length * 14);
  }

  function say(text, opts) {
    opts = opts || {};
    const delay = opts.instant ? 0 : (opts.delay != null ? opts.delay : typingDelay(text));
    const msg = { from: 'shelly', text: text, actions: opts.actions || null };
    if (!opts.instant) {
      const t = showTyping();
      setTimeout(function () { t.remove(); renderMessage(msg, true); if (!opened) { setUnread(unread() + 1); updateBadge(); bubble.classList.remove('pulse'); void bubble.offsetWidth; bubble.classList.add('pulse'); } }, delay);
    } else {
      renderMessage(msg, true);
    }
  }

  // Multi-bubble — sometimes Shelly sends a quick filler, then the real reply.
  function sayBeat(filler, full, opts) {
    opts = opts || {};
    say(filler, { delay: 400 });
    setTimeout(function () { say(full, opts); }, 380 + Math.random() * 220);
  }

  function renderUserMessage(text) { renderMessage({ from: 'user', text: text }, true); }

  // ===== Tone helpers =====
  const OPENERS = ['mm,', 'right,', 'okay so —', 'lemme see…', 'honestly', "alright,", "ooh,", "hmm,", "good one —"];
  const SOFT_ACKS = ['hmm…', 'ooh.', 'okay…', 'let me look…', 'one sec…'];
  const POSITIVE_ACKS = ['yeah!', 'totally.', 'love that.', 'right? 😄', 'big agree.'];
  const EMPATHY = ["rough one — happens.", "ugh, I feel that.", "okay deep breath.", "got you. don’t spiral."];

  function detectMood(text) {
    const s = text.toLowerCase();
    if (/(ugh|tired|exhausted|stressed|hate|annoying|sucks?|frustrat|overwhelm|burnt? out|fed up)/i.test(s)) return 'down';
    if (/(yay|love|amazing|wow|awesome|brilliant|🎉|🌟|❤|💜|excited)/i.test(s)) return 'up';
    if (/[?]$/.test(s.trim())) return 'asking';
    return 'neutral';
  }

  function humanisePrefix(userText) {
    const mood = detectMood(userText);
    if (mood === 'down') return pick(EMPATHY);
    if (mood === 'up') return pick(POSITIVE_ACKS);
    if (mood === 'asking' && Math.random() < 0.45) return pick(OPENERS);
    if (Math.random() < 0.25) return pick(OPENERS);
    return '';
  }

  function timeOfDay() {
    const h = new Date().getHours();
    if (h < 5) return 'late-night';
    if (h < 12) return 'morning';
    if (h < 17) return 'afternoon';
    if (h < 21) return 'evening';
    return 'night';
  }

  // ===== Real number helpers using db =====
  function dbReady() { return !!window.db; }
  function nameOf(id) { if (!dbReady()) return id; const u = db.findUser(id); return u ? u.name : id; }

  function statsLine() {
    if (!dbReady()) return '';
    const d = db.get();
    return 'Balance: <strong>' + d.credits.balance + ' credits</strong> · Plan: ' + d.credits.plan + ' · Active learners: ' + db.students().length + ' · Unread chats: ' + db.unreadChatCount();
  }

  // ===== Action handlers (driven by action chips) =====
  function handleAction(action, args) {
    args = args || {};
    if (action === 'navigate') { window.location.href = args.to; return; }
    if (action === 'topup') {
      const pack = db.topUp(args.pack || 'plus');
      say('Done! ✅ ' + pack.credits + ' credits added — new balance: <strong>' + db.get().credits.balance + '</strong>. The Store and your course pages now reflect the new total.', {
        actions: [{ label: 'Open Store', action: 'navigate', args: { to: '15-store.html' } }],
      });
      return;
    }
    if (action === 'cancel-session') { db.cancelSession(args.id); say('Session cancelled. I\'ll let the learner know. 📨'); return; }
    if (action === 'schedule-session') { db.scheduleSession(args.courseId, args.startsAt); say('Session locked in for ' + new Date(args.startsAt).toLocaleString() + '. ✅'); return; }
    if (action === 'mark-all-read') { db.markAllNotificationsRead(); say('All caught up ✨'); return; }
    if (action === 'send-message') { db.sendMessage(args.chatId, args.text); say('Sent. 📨'); return; }
    if (action === 'reset')  { if (confirm('Reset all demo data?')) { db.reset(); window.location.reload(); } return; }
    if (action === 'logout') { window.app && window.app.logout(); return; }
  }

  // ===== Slash commands =====
  function runCommand(cmd) {
    const parts = cmd.trim().split(/\s+/);
    const c = parts[0].toLowerCase();
    const rest = parts.slice(1).join(' ');

    if (c === '/help') {
      return "<strong>Commands I know:</strong><br>" +
        "<code>/summary</code> — today's snapshot<br>" +
        "<code>/today</code> — sessions today<br>" +
        "<code>/risk</code> — at-risk learners<br>" +
        "<code>/credits</code> · <code>/topup [starter|plus|pro]</code><br>" +
        "<code>/find &lt;name&gt;</code> · <code>/schedule [name]</code><br>" +
        "<code>/draft [name]</code> — multi-turn drafting<br>" +
        "<code>/template welcome|recap|missed|topup|feedback</code><br>" +
        "<code>/remember &lt;text&gt;</code> · <code>/notes</code> · <code>/forget</code><br>" +
        "<code>/remind &lt;text&gt; in 10m</code> · <code>/reminders</code><br>" +
        "<code>/snooze 30m</code> · <code>/unsnooze</code><br>" +
        "<code>/calc 100*4</code> — quick math<br>" +
        "<code>/go &lt;page&gt;</code> — jump anywhere<br>" +
        "<code>/tour</code> · <code>/clear</code> · <code>/reset</code><br><br>" +
        "Or <em>just ask me</em> in plain English — I'll figure it out.";
    }
    if (c === '/tour') { setTimeout(startOnboardingTour, 200); return 'Starting tour… ✨'; }
    if (c === '/summary') { setTimeout(showSummary, 100); return null; }
    if (c === '/remember') {
      const text = rest.trim();
      if (!text) return 'Tell me what to remember. Try <code>/remember Aadya prefers morning sessions</code>.';
      db.addNote(text);
      return 'Got it. I\'ll remember: <em>“' + escapeHtml(text) + '”</em> ✓<br>(see all with <code>/notes</code>)';
    }
    if (c === '/notes') {
      const notes = db.listNotes();
      if (!notes.length) return 'No notes yet. Try <code>/remember &lt;something&gt;</code>.';
      return '<strong>Your notes:</strong><br>' + notes.map(function (n, i) { return (i+1) + '. ' + escapeHtml(n.text); }).join('<br>');
    }
    if (c === '/forget') {
      const notes = db.listNotes();
      if (!notes.length) return 'Nothing to forget.';
      if (rest.toLowerCase() === 'all') { db.forgetAllNotes(); return 'Wiped all your notes. 🧹'; }
      const idx = parseInt(rest);
      if (idx && notes[idx-1]) { db.forgetNote(notes[idx-1].id); return 'Forgotten ✓'; }
      return 'Try <code>/forget 1</code> (by index) or <code>/forget all</code>.';
    }
    if (c === '/remind') {
      const m = rest.match(/^(.+?)\s+(in\s+\d+\s*(?:s|sec|seconds?|m|min|mins|minutes?|h|hr|hours?|d|days?))$/i);
      if (!m) return 'Try <code>/remind call Rajiv in 15m</code> or <code>/remind topup in 1h</code>.';
      const dueAt = parseRelative(m[2]);
      if (!dueAt) return 'Couldn\'t parse the time.';
      db.addReminder(m[1].trim(), dueAt.toISOString());
      return 'Reminder set ⏰ — I\'ll ping you at <em>' + dueAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) + '</em>.';
    }
    if (c === '/reminders') {
      const list = db.listReminders().filter(function (r) { return !r.fired; });
      if (!list.length) return 'No active reminders.';
      return '<strong>Active reminders:</strong><br>' + list.map(function (r) { return '⏰ ' + escapeHtml(r.text) + ' — ' + new Date(r.dueAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }); }).join('<br>');
    }
    if (c === '/snooze') {
      const dur = parseRelative('in ' + (rest || '30m'));
      if (!dur) return 'Try <code>/snooze 30m</code> or <code>/snooze 2h</code>.';
      db.muteUntil(dur.getTime());
      return 'Shhh 🤫 I\'ll be quiet until <em>' + dur.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) + '</em>. Say <code>/unsnooze</code> to bring me back.';
    }
    if (c === '/unsnooze') { db.muteUntil(0); return 'I\'m back! 🦸‍♀️'; }
    if (c === '/calc') {
      const v = quickCalc(rest);
      return v == null ? "I can only do simple math (e.g. <code>/calc 100*4</code>)." : "= <strong>" + v + "</strong>";
    }
    if (c === '/template') {
      const key = (rest || '').toLowerCase().trim();
      const tpl = TEMPLATES[key];
      if (!tpl) return 'Templates: <code>welcome</code>, <code>recap</code>, <code>missed</code>, <code>topup</code>, <code>feedback</code>, <code>welcome_student</code>.';
      const sample = applyTemplate(key, db.students()[0], (db.usersByRole('parent')[0] || {}).name);
      return '<strong>' + key + '</strong> template:<br><br><em>' + escapeHtml(sample).replace(/\n/g, '<br>') + '</em>';
    }
    if (c === '/go') {
      const PAGES = { classes: '5-classes.html', courses: '5-classes.html', home: '5-classes.html', course: '6-course-home.html', content: '7-course-content.html', group: '10-group-courses.html', recorded: '11-recorded-courses.html', users: '12-users.html', progress: '13-progress-reports.html', chats: '14-chats.html', store: '15-store.html', billing: '15-store.html', analytics: '16-analytics.html', notifications: '17-notifications.html' };
      const key = (rest || '').toLowerCase().trim();
      const dest = PAGES[key];
      if (!dest) return 'Where to? Try <code>/go chats</code> · <code>/go store</code> · <code>/go progress</code>.';
      setTimeout(function () { window.location.href = dest; }, 300);
      return 'Off we go → <em>' + key + '</em> ✨';
    }
    if (c === '/today') {
      const today = new Date().toISOString().split('T')[0];
      const sessions = db.upcoming().filter(function (s) { return s.startsAt.startsWith(today.slice(0, 7)); }).slice(0, 5);
      if (!sessions.length) return "You're clear today — no upcoming sessions on the books! 🌴";
      const lines = sessions.map(function (s) {
        const t = new Date(s.startsAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        const stu = (s.studentIds || []).map(nameOf).join(', ');
        return '• ' + t + ' — ' + stu + ' (' + s.status + ')';
      });
      return "Here's what's coming up:<br>" + lines.join('<br>');
    }
    if (c === '/risk') {
      const at = db.atRisk();
      if (!at.length) return 'Everyone\'s on track today. 🌟 Want to celebrate the top performers instead?';
      const lines = at.map(function (s) { return '• <strong>' + s.name + '</strong> — ' + s.progress + '% (active ' + s.active + ')'; });
      return "<strong>" + at.length + " learner(s) need attention:</strong><br>" + lines.join('<br>');
    }
    if (c === '/credits') { return statsLine() + '. Need a top-up? Just say <code>/topup plus</code>.'; }
    if (c === '/topup') {
      const pack = (rest || 'plus').toLowerCase();
      const valid = ['starter', 'plus', 'pro'].includes(pack);
      if (!valid) return 'Pack must be one of: starter, plus, pro. Try <code>/topup plus</code>.';
      const before = db.get().credits.balance;
      const p = db.topUp(pack);
      return 'Done! ✅ +' + p.credits + ' credits added. <strong>' + before + ' → ' + db.get().credits.balance + '</strong>.';
    }
    if (c === '/find') {
      if (!rest) return 'Tell me who. Try <code>/find aadya</code>.';
      const q = rest.toLowerCase();
      const matches = db.get().users.filter(function (u) { return u.name.toLowerCase().includes(q); });
      if (!matches.length) return 'No one matching "<em>' + escapeHtml(rest) + '</em>". 🤔';
      const lines = matches.slice(0, 5).map(function (u) { return '• <strong>' + u.name + '</strong> — ' + u.role + (u.progress != null ? ' · ' + u.progress + '% complete' : ''); });
      return matches.length + ' match(es):<br>' + lines.join('<br>');
    }
    if (c === '/schedule') {
      // If a learner name is provided, jump straight into the time-picker.
      const seed = rest && db.get().users.find(function (u) { return u.role === 'student' && u.name.toLowerCase().indexOf(rest.toLowerCase()) >= 0; });
      setTimeout(function () { startScheduleFlow(seed || null); }, 100);
      return null;
    }
    if (c === '/draft') {
      setTimeout(function () { startDraftFlow(rest || null); }, 100);
      return null;
    }
    if (c === '/clear') { db.shellyClear(); list.innerHTML = ''; return 'Fresh slate. ✨'; }
    if (c === '/reset') { return { text: 'Wipe all demo data and start fresh?', actions: [{ label: 'Yes, reset', primary: true, action: 'reset' }, { label: 'Cancel' }] }; }
    return 'Unknown command. Try <code>/help</code>.';
  }

  // ===== Natural-language router (powered by real db numbers) =====
  function route(q) {
    if (!dbReady()) return "I need to wake up first — give me a sec. (Make sure <code>data.js</code> loaded.)";

    const text = q.trim();
    if (text.startsWith('/')) {
      const r = runCommand(text);
      return r;
    }

    const s = text.toLowerCase();
    const d = db.get();

    // ===== Natural-language shortcuts to the new capabilities =====

    // Daily summary / what's on
    if (/^(summary|summarise|summarize|recap|brief me|priorit|what'?s (important|going on|happening)|what do i need to do|what.s up today)/i.test(s)) {
      setTimeout(showSummary, 100);
      return null;
    }

    // Remember
    if (/^(remember|note|don'?t forget)\b/i.test(s)) {
      const m = s.replace(/^(remember|note|don'?t forget)\s*(that\s+)?/i, '').trim();
      if (!m) return 'Sure — what should I remember?';
      db.addNote(m);
      return 'Locked in. 🧠 I\'ll remember: <em>“' + escapeHtml(m) + '”</em>';
    }
    if (/^(what (do you )?remember|show my notes|my notes|recall|what'?s in your memory)/i.test(s)) {
      const notes = db.listNotes();
      if (!notes.length) return "Nothing in my memory yet. Tell me something with <em>“remember…”</em> 💭";
      return '<strong>Here\'s what I remember:</strong><br>' + notes.slice(0, 5).map(function (n) { return '• ' + escapeHtml(n.text); }).join('<br>');
    }

    // Reminders
    if (/^(remind me|set a reminder|ping me)\b/i.test(s)) {
      // "remind me to call rajiv in 15 minutes"
      const m = s.replace(/^(remind me|set a reminder|ping me)\s*(to\s+)?/i, '');
      const rel = parseRelative(m);
      if (!rel) return 'Try <em>"remind me to call Rajiv in 15 minutes"</em>.';
      const txt = m.replace(/in\s+\d+\s*(s|sec|seconds?|m|min|mins|minutes?|h|hr|hours?|d|days?)/i, '').trim();
      db.addReminder(txt || 'Reminder', rel.toISOString());
      return 'On it ⏰ — I\'ll ping you at <em>' + rel.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) + '</em>.';
    }

    // Snooze
    if (/^(snooze|mute|be quiet|stop bugging|hush|shush)/i.test(s)) {
      const m = s.match(/(\d+)\s*(m|min|h|hr|hour|d|day)/);
      const dur = parseRelative('in ' + (m ? m[1] + m[2] : '30m'));
      db.muteUntil(dur.getTime());
      return 'Got it 🤫 quiet until <em>' + dur.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) + '</em>.';
    }
    if (/^(unsnooze|wake up|come back|unmute)/i.test(s)) { db.muteUntil(0); return "I'm back! 🦸‍♀️"; }

    // Math
    if (/^([\d.\s+\-*/()]+)$/.test(s) && /[\+\-\*\/]/.test(s)) {
      const v = quickCalc(s);
      if (v != null) return '= <strong>' + v + '</strong>';
    }
    if (/^(calc|math|compute|what'?s)\s+([\d.\s+\-*/()]+)$/i.test(s)) {
      const expr = s.replace(/^(calc|math|compute|what'?s)\s+/i, '');
      const v = quickCalc(expr);
      if (v != null) return '= <strong>' + v + '</strong>';
    }

    // Schedule (multi-turn)
    if (/(book|schedul|set up)\s+(a\s+)?(session|class|lesson)/i.test(s)) {
      const m = s.match(/(?:for|with)\s+(\w[\w ]*?)(?:\s+(?:on|at|tomorrow|today|in)|\s*$)/i);
      const seedName = m ? m[1].trim() : null;
      const found = seedName && db.get().users.find(function (u) { return u.role === 'student' && u.name.toLowerCase().indexOf(seedName.toLowerCase()) >= 0; });
      setTimeout(function () { startScheduleFlow(found || null); }, 100);
      return null;
    }

    // Draft (multi-turn)
    if (/(draft|write|compose).*(reply|message|note)|reply to/i.test(s)) {
      const m = s.match(/(?:to|for)\s+(\w[\w ]*)/);
      setTimeout(function () { startDraftFlow(m ? m[1].trim() : null); }, 100);
      return null;
    }

    // Template
    if (/^(template|give me a template|i need a template|template for)/i.test(s)) {
      const key = (s.match(/(welcome|recap|missed|topup|feedback)/) || [])[1];
      if (!key) return 'Templates: <code>welcome</code>, <code>recap</code>, <code>missed</code>, <code>topup</code>, <code>feedback</code>. Which?';
      const out = applyTemplate(key, db.students()[0]);
      return '<strong>' + key + '</strong> template:<br><br><em>' + escapeHtml(out).replace(/\n/g, '<br>') + '</em>';
    }

    // Navigation
    if (/^(go to|open|take me to|navigate to|show me)\s+(classes|courses|home|users|chats|store|store|analytics|notifications|progress|reports|content|group|recorded|store)/i.test(s)) {
      const m = s.match(/(classes|courses|home|users|chats|store|analytics|notifications|progress|reports|content|group|recorded)/);
      if (m) { setTimeout(function () { ask('/go ' + m[1]); }, 50); return null; }
    }

    // Time math: "when is my next session"
    if (/(when|what time).*next.*(session|class|lesson)/i.test(s) || /^next session/i.test(s)) {
      const next = db.upcoming()[0];
      if (!next) return 'No upcoming sessions on the books. 🌴';
      const u = db.findUser((next.studentIds || [])[0]);
      const t = new Date(next.startsAt);
      const ms = t.getTime() - Date.now();
      const rel = ms < 0 ? 'now' : ms < 3600000 ? Math.round(ms/60000) + ' min' : ms < 86400000 ? Math.round(ms/3600000) + ' hr' : Math.round(ms/86400000) + ' days';
      return 'Next up: <strong>' + (u ? u.name : 'session') + '</strong> in ' + rel + ' (<em>' + t.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) + '</em>).';
    }

    // ----- Greetings -----
    if (/^(hi|hello|hey+|yo|hola|namaste|good (morning|afternoon|evening))/i.test(s)) {
      const name = d.me.name.split(' ')[0];
      const tod = timeOfDay();
      const todGreet = tod === 'morning' ? 'morning' : tod === 'evening' ? 'evening' : tod === 'late-night' ? 'still up?' : 'hey';
      return pick([
        todGreet + ", " + name + ". what's on your mind?",
        "hey hey 👋 " + name + ", what are we doing?",
        "yo " + name + ". you've got " + db.upcoming().length + " sessions coming up — wanna start there?",
        "hi! anything specific or just checking in?",
      ]);
    }

    // ----- Identity -----
    if (/(who are you|what are you|about you|your name|introduce)/i.test(s))
      return pick([
        "I'm Shelly. think of me as your sidekick — I keep tabs on credits, sessions, learners, all the admin stuff so you don't have to. 🦸‍♀️",
        "Shelly the Super 🦸‍♀️ at your service. I run on real data from your app and can actually do things — top up, schedule, draft messages.",
        "your tiny tutor sidekick 💜 — I watch the numbers and nudge you when stuff matters.",
      ]);

    if (/(what can you do|capabilit|help me|how do you work)/i.test(s))
      return pick([
        "honestly a lot — top up credits, schedule sessions, draft replies, check who's slipping. easier to just ask me something and we'll see. or <code>/help</code> for the full menu.",
        "I can read your data and do real stuff with it. ask me about credits, schedule, at-risk learners, drafts — or just say <code>/help</code>.",
      ]);

    // ----- Credits / money -----
    if (/(credit|balance|how much|top.?up|recharge)/i.test(s)) {
      const bal = d.credits.balance;
      const lowMsg = pick([
        "you've got " + bal + " credits left. that's tight — want me to top up Plus?",
        "down to " + bal + ". I'd top up before the next session, honestly. shall I?",
        bal + " credits. running thin — Plus pack would buy you ~3 more weeks. yes?",
      ]);
      const okMsg = pick([
        bal + " credits sitting in your Plus plan. plenty of runway.",
        "you're at " + bal + " — comfy. want to see the Store anyway?",
        "balance is " + bal + ". no action needed unless you want to stock up.",
      ]);
      return {
        text: bal < 20 ? lowMsg : okMsg,
        actions: bal < 50
          ? [{ label: 'top me up', primary: true, action: 'topup', args: { pack: 'plus' } }, { label: 'just open Store', action: 'navigate', args: { to: '15-store.html' } }]
          : [{ label: 'open Store', action: 'navigate', args: { to: '15-store.html' } }],
      };
    }

    // ----- Schedule -----
    if (/(schedul|book|reschedul|new session)/i.test(s))
      return pick([
        "tell me the learner and I'll find a slot. or just say <code>/schedule Aadya</code> for example.",
        "easy — which course? type <code>/schedule &lt;name&gt;</code> or pop into a course → Home → Schedule.",
      ]);

    if (/(today|tonight|what.s on)/i.test(s)) { return runCommand('/today'); }
    if (/(tomorrow|next session|coming up)/i.test(s)) {
      const next = db.upcoming()[0];
      if (!next) return "you're clear — nothing on the books. take the win. 🌴";
      const u = db.findUser(next.studentIds[0]);
      return "next up is " + (u ? u.name : 'someone') + ", " + new Date(next.startsAt).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) + ".";
    }

    // ----- Students / progress -----
    if (/(at risk|falling behind|struggl|inactive|low engage|who.s low)/i.test(s)) { return runCommand('/risk'); }
    if (/(top|best|star) (student|learner|performer)/i.test(s)) {
      const top = db.students().sort(function (a, b) { return (b.progress || 0) - (a.progress || 0); })[0];
      return pick([
        top.name + " is your star — " + top.progress + "% done, " + top.sessionsAttended + " of " + top.sessionsTotal + " sessions. want me to draft a shout-out?",
        "honestly, " + top.name + ". " + top.progress + "% completion is wild. send them a kind word?",
      ]);
    }
    if (/(progress|report|completion)/i.test(s)) {
      const students = db.students();
      const avg = Math.round(students.reduce(function (s, u) { return s + (u.progress || 0); }, 0) / students.length);
      return {
        text: 'Average completion: <strong>' + avg + '%</strong> across ' + students.length + ' students. ' + db.atRisk().length + ' below 50%.',
        actions: [{ label: 'Open Progress Reports', primary: true, action: 'navigate', args: { to: '13-progress-reports.html' } }],
      };
    }
    if (/(student|learner|user) ?(list|count|all)/i.test(s)) {
      return {
        text: '<strong>' + db.students().length + ' students</strong>, ' + db.usersByRole('parent').length + ' parents, ' + db.usersByRole('instructor').length + ' instructors.',
        actions: [{ label: 'Open Users', primary: true, action: 'navigate', args: { to: '12-users.html' } }],
      };
    }

    // ----- Chats -----
    if (/(unread|new) (chat|message|dm)/i.test(s) || /(chat|inbox|message)/i.test(s)) {
      const unreadCount = db.unreadChatCount();
      return {
        text: unreadCount + ' unread message(s). ' + (unreadCount ? 'The latest is from ' + nameOf(db.unreadChats()[0].userId) + '.' : 'Inbox zero! 🎉'),
        actions: [{ label: 'Open Chats', primary: true, action: 'navigate', args: { to: '14-chats.html' } }],
      };
    }
    if (/(draft|write|compose|reply)/i.test(s)) {
      return 'Who am I drafting for? Try <code>/draft neha</code> or <code>/draft rajiv</code>.';
    }

    // ----- Notifications -----
    if (/(notif|alert)/i.test(s)) {
      const u = db.unreadNotifCount();
      return {
        text: u + ' unread notification(s). ' + (u ? 'Most urgent: ' + db.unreadNotifs()[0].title + '.' : 'All caught up.'),
        actions: u ? [{ label: 'Mark all read', primary: true, action: 'mark-all-read' }, { label: 'Open', action: 'navigate', args: { to: '17-notifications.html' } }] : [{ label: 'Open', action: 'navigate', args: { to: '17-notifications.html' } }],
      };
    }

    // ----- Analytics -----
    if (/(revenue|earning|income|money this month|stat|analytic|metric|dashboard)/i.test(s)) {
      const a = d.analytics;
      return {
        text: 'Revenue this month: <strong>₹' + a.revenue.toLocaleString('en-IN') + '</strong> (+' + a.revenueGrowth + '% MoM). Sessions: ' + a.sessionsHeld + '. Rating: ' + a.avgRating + '⭐.',
        actions: [{ label: 'Open Analytics', primary: true, action: 'navigate', args: { to: '16-analytics.html' } }],
      };
    }

    // ----- Content / pricing -----
    if (/(price|pricing|fee|cost|plan)/i.test(s)) {
      return {
        text: 'Three packs: <strong>Starter</strong> ₹999/20 credits, <strong>Plus ₹3,999/100</strong> (most popular), <strong>Pro</strong> ₹9,499/300.',
        actions: [{ label: 'Open Store', primary: true, action: 'navigate', args: { to: '15-store.html' } }],
      };
    }
    if (/(content|lesson|quiz|video|certificate)/i.test(s))
      return 'Open a course → <em>Content</em> tab. Add sections, drop in videos/PDFs/quizzes, and certificates auto-issue at 100%.';

    // ----- Personality -----
    if (/(joke|funny|laugh)/i.test(s))
      return pick([
        'Why did the math book look sad? Too many problems. 📚',
        "Parallel lines have so much in common… it's a shame they'll never meet. 📏",
        "I told my computer a tutoring joke. It said: 'I don't get it, but I'm 60% complete.' 💻",
      ]);
    if (/(love|favourite|favorite) (you|shelly)/i.test(s)) return "Aww, stop it — I'm blushing under this mask. 💗";
    if (/(motivat|inspire|encouragement)/i.test(s)) return pick([
      "Every learner you nudge today is one closer to their <em>aha</em> moment. ✨",
      "Small wins compound. Send one nudge, schedule one session, draft one message. The rest follows. 💪",
      "You're not just teaching — you're building the brain of a future scientist / poet / coder / dreamer. 🚀",
    ]);

    // ----- Gratitude / sign-off -----
    if (/(thank|thx|ty|appreciate)/i.test(s)) return pick(['anytime 💜', 'np!', 'happy to help.', "you're welcome — that's the job 🦸‍♀️", 'always.']);
    if (/(bye|good ?night|see ya|cya|gn)/i.test(s)) return "Talk soon — I'll keep an eye on your sessions. 👋";

    // ----- Account / settings -----
    if (/(log ?out|sign out|exit|leave)/i.test(s)) {
      return { text: 'Log out and head back to the login screen?', actions: [{ label: 'Yes, log me out', primary: true, action: 'logout' }, { label: 'Cancel' }] };
    }
    if (/(reset|wipe|clear data|start over|fresh)/i.test(s)) {
      return { text: 'Wipe all your edits and restore the seeded demo data?', actions: [{ label: 'Yes, reset', primary: true, action: 'reset' }, { label: 'Cancel' }] };
    }

    // ----- Onboarding / tour -----
    if (/(tour|onboard|walk.?through|show me around|guide me|how to use|getting started)/i.test(s)) {
      return { text: 'Want me to run the tour again? I\'ll spotlight each section of the app and explain what it does.', actions: [{ label: 'Yes, tour', primary: true, onClick: function () { startOnboardingTour(); } }, { label: 'Maybe later' }] };
    }

    // ----- Platform philosophy / about -----
    if (/(what is (super )?sheldon|about (the )?(app|platform)|why use)/i.test(s))
      return "<strong>Super Sheldon</strong> is a Tutor Management Software 🦸 — one place to run <em>everything</em>: schedule sessions, track student progress, chat with parents, sell courses, take payments, and grow with analytics. Think of it as <em>your school's operating system</em>.";
    if (/(philosophy|mission|why exist|vision)/i.test(s))
      return "Our take: great tutors shouldn't spend their evenings juggling WhatsApp, Excel, and Zoom. Super Sheldon handles the admin so you can teach. Every feature exists to <strong>protect your time</strong> and <strong>improve learner outcomes</strong>. 💜";

    // ----- Feature explanations -----
    if (/(how (do|does) (course|class)|create.*course|start.*course)/i.test(s))
      return "Three flavours of courses: <strong>1:1</strong> (one learner), <strong>Group</strong> (cohort), and <strong>Recorded</strong> (on-demand). Each has Home, Content, Billing, and Settings tabs.";
    if (/(how (do|does) progress|completion rate)/i.test(s))
      return "Progress = <strong>sessions attended</strong> ÷ <strong>scheduled</strong>, weighted by content unlocked. Under 50% lands in <em>At Risk</em> — I'll nudge you when a learner falls behind for 7+ days.";
    if (/(how (do|does) (chat|message)|inbox|chat work)/i.test(s))
      return "<em>Chats</em> is a unified inbox: parents, students, instructors in one place. I suggest smart replies and can draft full responses (<code>/draft &lt;name&gt;</code>).";
    if (/(how (do|does) (credit|billing)|how credit work)/i.test(s))
      return "Credits = sessions. Each 1:1 session consumes one credit. When a parent's balance hits zero, sessions can't be scheduled. They top up from the <em>Store</em>.";
    if (/(how (do|does) (analytic|stat)|metric)/i.test(s))
      return "<em>Analytics</em> shows revenue, sessions held, active learners, ratings, and revenue mix. I forecast next month from a 3-month trend.";
    if (/(certificate|reward|badge)/i.test(s))
      return "Certificates auto-issue at 100% completion. Design under any course → <em>Content</em> → <strong>Certificates → Create</strong>. ₹999/mo add-on makes them LinkedIn-verified.";
    if (/(white.?label|brand|custom logo)/i.test(s))
      return "<strong>White-label add-on</strong> (₹1,999/mo) — replaces Super Sheldon's branding with yours. Learners see your school, not us.";
    if (/(custom domain|own url|own website)/i.test(s))
      return "<strong>Custom domain</strong> (₹499/mo) — host on yourname.com. DNS setup ~10 minutes; I'll walk you through it.";
    if (/(integration|zoom|google calendar|sync|connect)/i.test(s))
      return "Coming soon: native Zoom + Google Calendar sync. For now, paste your Zoom link into a session's Private Note. 🎥";

    // ----- Workflow guides -----
    if (/(how (do|does) (i )?(schedule|book) ?(a )?session|book a class)/i.test(s))
      return "Three taps: course → <em>Home</em> → <strong>Schedule Sessions</strong>. Or say <code>/schedule &lt;course&gt;</code> and I'll pick a free slot in the learner's timezone.";
    if (/(how (do|does) (i )?(invite|add) ?(a )?(student|user|parent|instructor))/i.test(s))
      return "<em>Users</em> tab → <strong>Invite User</strong>. I send them an email/SMS link. They appear in your roster the moment they accept.";
    if (/(how (do|does) (i )?(top.?up|buy credit)|where.*credit)/i.test(s))
      return "<em>Store</em> tab. Or just say <code>/topup plus</code> and I'll do it instantly. ⚡";
    if (/(how (do|does) (i )?(start|run) ?(a )?live session)/i.test(s))
      return "Course Home → hit <strong>Start</strong> on the session row at session time. I log attendance automatically.";
    if (/(how (do|does) (i )?(cancel|reschedul) ?(a )?session)/i.test(s))
      return "On any session row → ⋮ → <em>Cancel session</em>. The learner is notified and the credit is refunded automatically.";

    // ----- Best practices -----
    if (/(best practice|tip|advice|how to improve|engagement|retention)/i.test(s))
      return pick([
        "💡 <strong>Recap the previous session</strong> in your first 60 seconds. Retention doubles when learners connect new material to old.",
        "💡 Ask parents to <strong>sit in once a month</strong> — engagement jumps when they see learning happen live.",
        "💡 Send <strong>one short message</strong> after every session: what you covered + one thing to practice. 30 seconds, doubles retention.",
        "💡 At-risk learners come back if you <strong>reschedule within 48 hours</strong>. After a week, you've lost them.",
      ]);
    if (/(parent communication|talk to parent|parent message)/i.test(s))
      return "Three rules for parent chats: <strong>1) Lead with the win</strong>, <strong>2) One specific anecdote</strong>, <strong>3) End with a question</strong>. I'll draft any message — <code>/draft &lt;name&gt;</code>.";
    if (/(scheduling tip|when to schedule|best time)/i.test(s))
      return "Sweet spots: <strong>Mon-Thu 4:30–7:30 PM</strong> and <strong>Sat 10 AM–12 PM</strong>. Avoid Fri evenings + Sun nights — attendance drops 30%.";

    // ----- Conversational extras -----
    if (/(everything|what.*can.*do|features|all features)/i.test(s))
      return "Big picture: <strong>Courses</strong>, <strong>Users</strong>, <strong>Progress Reports</strong>, <strong>Chats</strong>, <strong>Store</strong>, <strong>Analytics</strong>, <strong>Notifications</strong>. Want a guided tour?";
    if (/(privacy|gdpr|data|secure|safety)/i.test(s))
      return "All learner data is encrypted in transit and at rest. Parents control sharing. GDPR + COPPA compliant. Details under <em>Account → Privacy</em>.";
    if (/(are you (real|an ai|a bot|human))/i.test(s))
      return "I'm a friendly mascot 🦸‍♀️ that reads your real data and triggers real actions. In production I'd hook into Claude/Gemini for deeper conversation. For now I know everything about this app.";
    if (/(why are you|why do you exist)/i.test(s))
      return "To save you time. The boring stuff — credits, scheduling, reminders, draft replies — I handle. The magic moments with learners — that's all you. 💜";
    if (/(your day|how was your day)/i.test(s))
      return pick(["Saved a tutor 47 minutes today — not bad. 🦸‍♀️", "Topped up 3 plans, scheduled 12 sessions, told 2 jokes. Standard Tuesday."]);
    if (/(can you|will you) (sing|dance|cook|drive|sleep)/i.test(s))
      return "Sadly no — I'm a 2D superhero. But I will nudge you, top up credits, and draft messages at 3 AM. 💪";

    // Casual filler one-word inputs
    if (/^(ok|okay|kay|k|cool|nice|sure|alright)$/i.test(s)) return pick(['👍', 'cool cool.', 'sweet.', 'right — anything else?']);
    if (/^(lol|haha|hehe|lmao|rofl)$/i.test(s)) return pick(['😄', 'right? 😄', 'haha.']);
    if (/^(ugh|meh|argh|hmph)$/i.test(s)) return pick(["rough one?", "ugh, I feel that. anything I can take off your plate?", "want me to handle the boring stuff for a bit?"]);
    if (/^(tired|exhausted|stressed|busy|swamped|overwhelmed)$/i.test(s)) return "long day? I got the admin — just say <code>/today</code> and I'll show you the shortest path through it.";

    // Smart fallback — vary the apology, give 1 idea instead of a list
    const fallbacks = [
      "wait, can you say that another way? I'm not sure I caught it.",
      "hmm — could you rephrase? or try <code>/help</code> for stuff I'm sure I can do.",
      "okay you've got me thinking. want to try a slash command? <code>/help</code> shows the lot.",
      "honestly not sure — but I'm great at <em>credits</em>, <em>schedule</em>, <em>chats</em>, or <em>“who's at risk?”</em> if any of those help.",
    ];
    return { text: pick(fallbacks), _fallback: true };
  }

  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  function ask(query) {
    renderUserMessage(query);
    open();
    const reply = route(query);
    const text = typeof reply === 'string' ? reply : (reply && reply.text);
    const actions = (reply && reply.actions) || null;
    const isFallback = reply && reply._fallback;

    // === Silent Gemini fallback ===
    // If the rule-based router didn't match AND a key is configured in
    // gemini.js, quietly ask Gemini with our tight system prompt + live context.
    // The user has no idea Gemini is being called — to them, Shelly answered.
    if (isFallback && window.gemini && gemini.isReady()) {
      const typing = showTyping();
      gemini.ask(query).then(function (out) {
        if (typing) typing.remove();
        // Sanitise — Gemini sometimes slips into markdown even when told not to
        const html = out
          .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*([^*]+?)\*/g, '<em>$1</em>')
          .replace(/`([^`]+?)`/g, '<code>$1</code>')
          .replace(/\n\n/g, '<br><br>')
          .replace(/\n/g, '<br>');
        say(html, { instant: true });
      }).catch(function () {
        // On any error, silently fall back to the rule-based reply.
        // The user still gets a response — they never see the error.
        if (typing) typing.remove();
        say(text, { actions: actions, instant: true });
      });
      return;
    }

    if (!text) return;
    // Optional human preamble — sometimes a quick filler before the real reply.
    const prefix = humanisePrefix(query);
    if (prefix && Math.random() < 0.55) {
      sayBeat(prefix, text, { actions: actions });
    } else {
      say(text, { actions: actions });
    }
  }

  // ===== Proactive ticks =====
  function proactive() {
    if (!dbReady()) return;

    // Always check reminders, even when muted
    checkReminders();

    if (db.isMuted()) return; // user explicitly asked for quiet

    const d = db.get();
    const now = Date.now();
    const FIFTEEN_MIN = 15 * 60 * 1000;

    // Low-credit nudge (once per session)
    if (d.credits.balance < 8 && now - db.shellyNudgedAt('low-credits') > FIFTEEN_MIN) {
      db.shellyNudge('low-credits');
      say('Heads up — only <strong>' + d.credits.balance + ' credits</strong> left. Want me to top up the Plus pack?', {
        actions: [{ label: 'Top up Plus', primary: true, action: 'topup', args: { pack: 'plus' } }, { label: 'Not yet' }],
      });
    }
    // Unread chat aging > 30 min
    const aging = d.chats.find(function (c) { return c.unread > 0 && (now - new Date(c.lastMessageAt).getTime()) > 30 * 60 * 1000; });
    if (aging && now - db.shellyNudgedAt('aging-chat-' + aging.id) > FIFTEEN_MIN * 2) {
      db.shellyNudge('aging-chat-' + aging.id);
      const u = db.findUser(aging.userId);
      say('A chat with <strong>' + (u ? u.name : 'someone') + '</strong> is getting cold. Want me to draft a reply?', {
        actions: [{ label: 'Draft reply', primary: true, onClick: function () { ask('/draft ' + (u ? u.name.split(' ')[0] : '')); } }, { label: 'Later' }],
      });
    }
  }

  function startProactive() {
    if (proactiveTimer) return;
    proactiveTimer = setInterval(proactive, 30000);
  }

  // ===== Onboarding tour =====
  function startOnboardingTour() {
    close(); // close the chat panel so backdrop is clean
    const steps = [
      { selector: '.sidebar', title: 'Your command centre', body: "This sidebar is your map. Every section of Super Sheldon lives here — from courses to credits.", position: 'right' },
      { selector: '.nav-item.active', title: 'Courses', body: "Your <strong>1:1, group, and recorded courses</strong> all live here. Click a course to manage sessions, content, and learners.", position: 'right' },
      { selector: '.nav-item[href="12-users.html"]', title: 'Users', body: "Everyone in your workspace — students, parents, instructors. <strong>Invite</strong> from the top-right. Adding a student here makes them show up everywhere else automatically.", position: 'right' },
      { selector: '.nav-item[href="13-progress-reports.html"]', title: 'Progress Reports', body: "See how each learner is doing — completion %, sessions attended, who's at risk. <strong>Spot at-risk students before they drop off.</strong>", position: 'right' },
      { selector: '.nav-item[href="14-chats.html"]', title: 'Chats', body: "Talk to parents, students, instructors — all in one inbox. I'll suggest smart replies, or you can ask me to draft one for you.", position: 'right' },
      { selector: '.nav-item[href="15-store.html"]', title: 'Store', body: "Buy credit packs, unlock add-ons (white-label, custom domain), and see your billing history. Run low? I'll nudge you.", position: 'right' },
      { selector: '.nav-item[href="16-analytics.html"]', title: 'Analytics', body: "Revenue, sessions, ratings, top courses — all the numbers that matter. <strong>Currently up 12% MoM.</strong> 📈", position: 'right' },
      { selector: '.nav-item[href="17-notifications.html"]', title: 'Notifications', body: "Everything that needs your attention. The orange dot tells you when something new is waiting.", position: 'right' },
      { selector: '.shelly-bubble', title: "I'm right here", body: "Tap me anytime. I read your real numbers and can <strong>do things for you</strong> — top up credits, schedule sessions, draft messages. Try <code>/help</code>!", position: 'left' },
    ];
    // Filter out missing selectors so the tour doesn't break on pages without all nav items
    tourState = { steps: steps.filter(function (s) { return document.querySelector(s.selector); }), index: 0 };
    showTourStep();
  }

  function showTourStep() {
    if (!tourState) return;
    if (tourState.index >= tourState.steps.length) { endTour(); return; }
    const step = tourState.steps[tourState.index];
    const target = document.querySelector(step.selector);
    if (!target) { tourState.index++; showTourStep(); return; }

    // Cleanup any existing tour elements first
    document.querySelectorAll('.shelly-tour-backdrop, .shelly-tour-spot, .shelly-tour-tt').forEach(function (el) { el.remove(); });

    target.scrollIntoView({ block: 'center', behavior: 'smooth' });
    setTimeout(function () {
      const rect = target.getBoundingClientRect();

      const bd = document.createElement('div'); bd.className = 'shelly-tour-backdrop';
      document.body.appendChild(bd);

      const spot = document.createElement('div'); spot.className = 'shelly-tour-spot';
      spot.style.top = (rect.top - 6) + 'px';
      spot.style.left = (rect.left - 6) + 'px';
      spot.style.width = (rect.width + 12) + 'px';
      spot.style.height = (rect.height + 12) + 'px';
      document.body.appendChild(spot);

      const tt = document.createElement('div'); tt.className = 'shelly-tour-tt';
      tt.innerHTML =
        '<div class="head"><div class="av">' + shellyHeadSvg(34) + '</div><div><h4>' + step.title + '</h4><p>Step ' + (tourState.index + 1) + ' of ' + tourState.steps.length + '</p></div></div>' +
        '<div class="body">' + step.body + '</div>' +
        '<div class="ft"><span class="progress">' + (tourState.index + 1) + ' / ' + tourState.steps.length + '</span>' +
        '<div class="btns"><button class="skip" id="tour-skip" type="button">Skip tour</button><button class="next" id="tour-next" type="button">' + (tourState.index === tourState.steps.length - 1 ? 'Finish ✨' : 'Next →') + '</button></div></div>';

      // Position tooltip — right of target if there's room, else left, top, or bottom
      const ttWidth = 300, ttHeight = 180, margin = 16;
      let top, left;
      if (step.position === 'right' && rect.right + ttWidth + margin < window.innerWidth) {
        top = Math.max(margin, rect.top + (rect.height / 2) - (ttHeight / 2));
        left = rect.right + margin;
      } else if (step.position === 'left' && rect.left - ttWidth - margin > 0) {
        top = Math.max(margin, rect.top + (rect.height / 2) - (ttHeight / 2));
        left = rect.left - ttWidth - margin;
      } else if (rect.bottom + ttHeight + margin < window.innerHeight) {
        top = rect.bottom + margin;
        left = Math.min(window.innerWidth - ttWidth - margin, Math.max(margin, rect.left + (rect.width / 2) - (ttWidth / 2)));
      } else {
        top = Math.max(margin, rect.top - ttHeight - margin);
        left = Math.min(window.innerWidth - ttWidth - margin, Math.max(margin, rect.left + (rect.width / 2) - (ttWidth / 2)));
      }
      tt.style.top = top + 'px';
      tt.style.left = left + 'px';
      document.body.appendChild(tt);

      tt.querySelector('#tour-skip').addEventListener('click', endTour);
      tt.querySelector('#tour-next').addEventListener('click', function () { tourState.index++; showTourStep(); });
    }, 320);
  }

  function endTour() {
    document.querySelectorAll('.shelly-tour-backdrop, .shelly-tour-spot, .shelly-tour-tt').forEach(function (el) { el.remove(); });
    tourState = null;
    if (window.db) db.completeOnboarding();
    open();
    say("That's the tour! 🎉 You can always reach me here. Try asking <em>“who's at risk?”</em>, <em>“top up credits”</em>, or just type <code>/help</code> to see what I can do.");
  }

  // Run onboarding when arriving fresh after sign-in
  function maybeOnboard() {
    if (!window.db) return;
    if (!db.isSignedIn() || !db.isFirstLogin()) return;
    setTimeout(function () {
      open();
      pendingQuestion = 'name';
      say("Hi! I'm <strong>Shelly the Super</strong> 🦸‍♀️ — your AI sidekick on Super Sheldon. Before we dive in, <strong>what should I call you?</strong> (Just type your name below.)", { delay: 500 });
    }, 700);
  }

  // ===== Public API =====
  function setContext(ctx) { pageContext = ctx || {}; }
  function suggest(arr) { renderSuggestions(arr); }

  // Refresh the suggestion chips based on the user's current state.
  function smartSuggestions() {
    if (!dbReady()) return;
    const items = [];
    const credits = db.get().credits.balance;
    if (credits < 15) items.push('Top up credits');
    if (db.unreadChatCount() > 0) items.push('Summarise unread chats');
    if (db.atRisk().length > 0) items.push("Who's at risk?");
    items.push('What\'s on today?');
    items.push('/summary');
    if (db.listNotes().length === 0) items.push('Remember something');
    renderSuggestions(items.slice(0, 4));
  }
  // Refresh suggestions on db changes
  if (window.db) db.subscribe(smartSuggestions);

  window.shelly = {
    say: say, ask: ask, open: open, close: close, toggle: toggle,
    suggest: suggest, context: setContext,
    tour: startOnboardingTour,
    summary: showSummary,
    schedule: startScheduleFlow,
    draft: startDraftFlow,
    template: function (key) { return applyTemplate(key, db.students()[0]); },
    remember: function (text) { db.addNote(text); },
    remind: function (text, dueAt) { db.addReminder(text, (dueAt instanceof Date ? dueAt : new Date(dueAt)).toISOString()); },
    snooze: function (minutes) { db.muteUntil(Date.now() + (minutes || 30) * 60000); },
    do: {
      topUp: function (pack) { return handleAction('topup', { pack: pack }); },
      schedule: function (courseId, startsAt) { return handleAction('schedule-session', { courseId: courseId, startsAt: startsAt }); },
      cancelSession: function (id) { return handleAction('cancel-session', { id: id }); },
      markAllRead: function () { return handleAction('mark-all-read'); },
      sendMessage: function (chatId, text) { return handleAction('send-message', { chatId: chatId, text: text }); },
      reset: function () { return handleAction('reset'); },
      logout: function () { return handleAction('logout'); },
      tour: startOnboardingTour,
    },
  };

  // Silently load the Gemini adapter so the fallback is available without
  // editing every HTML page. If gemini.js is missing or fails to load, Shelly
  // simply uses her rule-based responses — no user-visible difference.
  function loadGemini() {
    if (window.gemini) return;
    const existing = document.querySelector('script[src="gemini.js"]');
    if (existing) return;
    const s = document.createElement('script');
    s.src = 'gemini.js';
    s.async = true;
    s.onerror = function () { /* silent — fallback to rule-based */ };
    document.head.appendChild(s);
  }

  function init() {
    injectStyles();
    build();
    startProactive();
    maybeOnboard();
    loadGemini();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

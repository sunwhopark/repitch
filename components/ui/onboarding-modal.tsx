"use client";

import {
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  Minus,
  Package,
  Plus,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { supabase } from "@/lib/supabase/client";

type Platform = "instagram" | "youtube";
type Step = 1 | 2 | 3 | 4 | 5 | 6;
type SelectKey =
  | "averageLikes"
  | "averageSaves"
  | "averageShares"
  | "averageViews"
  | "collabCount";
type ToneOption = "정보" | "유머" | "일상" | "기타: 직접 입력";

const categories = [
  "일상",
  "뷰티",
  "패션",
  "건강",
  "음식",
  "운동",
  "취준",
  "여행",
  "자기계발",
  "제테크",
  "IT",
  "기타",
];

const rangeOptions = [
  "1천 미만",
  "1천-1만",
  "1만-10만",
  "10만 이상",
];
const collabOptions = ["0회", "1-3회", "4-6회", "7-10회", "10회 이상"];

const contentTypeOptions = ["숏폼", "게시물", "스토리", "롱폼", "기타 : 직접 입력"];
const contentTypeOtherLabel = "기타 : 직접 입력";
const toneOptions: ToneOption[] = ["정보", "유머", "일상", "기타: 직접 입력"];
const weekdayLabels = ["일", "월", "화", "수", "목", "금", "토"];
const isBrandSearchEnabled = false;
const completionLogoUrl = "/repitch_wordmark.png";

const brand = {
  name: "이니스프리",
  meta: "뷰티 · 화장품 · 팔로워 응답률 82%",
};

const screenStyles = `
.onboarding-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(10, 10, 11, 0.55);
  box-sizing: border-box;
}
.onboarding-card {
  position: relative;
  box-sizing: border-box;
  width: min(100%, 402px);
  height: min(760px, 92vh);
  background: #ffffff;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.28);
}
.onboarding-close {
  position: absolute;
  top: 14px;
  right: 14px;
  z-index: 20;
  width: 32px;
  height: 32px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  padding: 0;
  border: 0;
  cursor: pointer;
  color: #171717;
  background: rgba(244, 244, 245, 0.9);
}
.onboarding-close:hover { background: #e4e4e7; }
.onboarding-scope { height: 100%; }
@media (prefers-reduced-motion: no-preference) {
  .onboarding-overlay { animation: onboarding-overlay-in 200ms ease-out; }
  .onboarding-card { animation: onboarding-card-in 240ms cubic-bezier(0.22, 1, 0.36, 1); }
}
@keyframes onboarding-overlay-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes onboarding-card-in {
  from { opacity: 0; transform: translateY(12px) scale(0.98); }
  to { opacity: 1; transform: none; }
}
@media (max-width: 440px) {
  .onboarding-overlay { padding: 0; }
  .onboarding-card { width: 100%; height: 100%; border-radius: 0; }
}
@media (min-width: 640px) {
  /* Desktop: phone-like card. Variable height between a phone-ish min and
     a viewport cap; inner area scrolls past the cap with a visible scrollbar. */
  .onboarding-card {
    width: min(100%, 390px);
    height: auto;
    min-height: min(660px, 86vh);
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    interpolate-size: allow-keywords;
    transition: height 220ms ease;
  }
  .onboarding-card .onboarding-scope {
    height: auto;
    min-height: 0;
    flex: 1 1 auto;
    display: flex;
    flex-direction: column;
  }
  .onboarding-card .onboarding-scope .mobile-screen {
    height: auto;
    min-height: 0;
    flex: 1 1 auto;
  }
  /* Always-visible slim scrollbar on scrollable steps.
     The .onboarding-scope segment raises specificity above the base
     scrollbar-hiding rules (which appear later in source).
     A COLORED track is the key: with only a transparent track the thumb
     auto-hides (overlay) on macOS and the scrollbar looks absent. The standard
     props cover Chrome/Firefox; the ::-webkit-* block covers Safari, which
     ignores scrollbar-width/scrollbar-color. */
  .onboarding-card .onboarding-scope .scroll-area,
  .onboarding-card .onboarding-scope .preview-scroll {
    width: 100%;
    margin-left: 0;
    margin-right: 0;
    padding-right: 6px;
    scrollbar-width: thin;
    scrollbar-color: #9a9aa3 #ececef;
  }
  .onboarding-card .onboarding-scope .scroll-area::-webkit-scrollbar,
  .onboarding-card .onboarding-scope .preview-scroll::-webkit-scrollbar {
    width: 10px;
  }
  .onboarding-card .onboarding-scope .scroll-area::-webkit-scrollbar-track,
  .onboarding-card .onboarding-scope .preview-scroll::-webkit-scrollbar-track {
    background: #ececef;
    border-radius: 8px;
  }
  .onboarding-card .onboarding-scope .scroll-area::-webkit-scrollbar-thumb,
  .onboarding-card .onboarding-scope .preview-scroll::-webkit-scrollbar-thumb {
    background: #9a9aa3;
    border-radius: 8px;
    border: 2px solid #ececef;
  }
  .onboarding-card .onboarding-scope .scroll-area:hover::-webkit-scrollbar-thumb,
  .onboarding-card .onboarding-scope .preview-scroll:hover::-webkit-scrollbar-thumb {
    background: #71717a;
  }
}
@media (min-width: 640px) and (prefers-reduced-motion: reduce) {
  .onboarding-card { transition: none; }
}
@keyframes completion-rise {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: none; }
}
@keyframes email-modal-fade {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes email-modal-pop {
  from { opacity: 0; transform: translateY(12px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
.onboarding-scope {

  box-sizing: border-box;
  height: 100%;
  font-family: inherit;
  color: var(--black);
  --white: #ffffff;
  --black: #0a0a0b;
  --blue-150: #f4f4f5;
  --blue-300: #a1a1aa;
  --blue-500: #171717;
  --blue-600: #171717;
  --blue-700: #171717;
  --gray-100: #edeef2;
  --gray-200: #dcdfe6;
  --gray-400: #9aa0ad;
  --gray-600: #4b5260;
  --gray-900: #1a1d24;


* { box-sizing: border-box; }
button, input, select { font: inherit; }
button { border: 0; cursor: pointer; }
.screen-shell {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  background: var(--white);
}
.mobile-screen {
  width: min(100%, 402px);
  height: 100vh;
  min-height: 760px;
  background: var(--white);
  display: flex;
  flex-direction: column;
  gap: 43px;
  padding: 0 20px;
  overflow: hidden;
}
.back-bar {
  width: 100%;
  padding-top: 60px;
  padding-left: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 0 0 auto;
}
.back-button {
  width: 20px;
  height: 20px;
  margin-left: -8px;
  padding: 0;
  background: transparent;
  color: var(--black);
  display: grid;
  place-items: center;
  flex: 0 0 auto;
}
.stepper {
  flex: 1 1 auto;
  min-width: 0;
  height: 18px;
  position: relative;
}
.stepper-bars {
  position: absolute;
  top: 7px;
  left: 0;
  width: calc(100% - 40px);
  height: 4px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4px;
}
.stepper-bar {
  height: 4px;
  border-radius: 2px;
  background: var(--gray-100);
}
.stepper-bar-done { background: var(--blue-300); }
.stepper-bar-active { background: var(--blue-500); }
.stepper-count {
  position: absolute;
  top: 0;
  right: 0;
  width: 38px;
  margin: 0;
  text-align: right;
  font-size: 12px;
  line-height: 18px;
  letter-spacing: 0.24px;
}
.stepper-count strong { color: var(--blue-700); font-weight: 700; }
.stepper-count span { color: var(--gray-600); font-weight: 400; }
.scroll-area {
  width: calc(100% + 16px);
  margin-right: -16px;
  padding-right: 16px;
  flex: 1 1 auto;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}
.scroll-area::-webkit-scrollbar { display: none; }
.content {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 25px;
  padding-bottom: 32px;
}
.brand-content {
  flex: 1 1 auto;
  min-height: 0;
  gap: 30px;
}
.title-block {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
  white-space: nowrap;
}
.title-block h1 {
  margin: 0;
  color: #000000;
  font-size: 20px;
  line-height: normal;
  font-weight: 700;
  letter-spacing: 0;
}
.title-block p {
  margin: 0;
  color: var(--gray-400);
  font-size: 14px;
  line-height: 1;
  font-weight: 400;
  letter-spacing: -0.042px;
}
.story-content {
  align-items: flex-start;
  gap: 25px;
}
.story-title h1 {
  line-height: 25px;
  font-weight: 600;
  white-space: normal;
}
.story-title p {
  line-height: 1;
}
.final-content {
  align-items: flex-start;
  gap: 29px;
}
.price-section, .reuse-section, .schedule-section {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
.price-section { gap: 10px; }
.price-field {
  width: 100%;
  height: 48px;
  border: 1px solid var(--gray-200);
  border-radius: 12px;
  background: var(--white);
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 15px;
}
.price-field:focus-within {
  border-color: var(--blue-500);
}
.price-input {
  min-width: 0;
  flex: 1 1 auto;
  border: 0;
  outline: 0;
  color: var(--black);
  background: transparent;
  font-size: 14px;
  line-height: normal;
  text-align: right;
}
.price-input::placeholder {
  color: var(--gray-400);
  opacity: 1;
}
.price-unit {
  color: var(--gray-400);
  font-size: 14px;
  line-height: normal;
  white-space: nowrap;
}
.reuse-section { gap: 10px; }
.final-heading {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.final-heading h2 {
  margin: 0;
  color: #000000;
  font-size: 20px;
  line-height: 25px;
  font-weight: 600;
  letter-spacing: 0;
}
.final-heading p {
  margin: 0;
  color: var(--gray-600);
  font-size: 14px;
  line-height: 20px;
  font-weight: 400;
  letter-spacing: -0.042px;
}
.reuse-row {
  width: 100%;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}
.reuse-button {
  min-height: 38px;
  border: 1px solid var(--gray-200);
  border-radius: 999px;
  background: var(--white);
  color: var(--gray-600);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 1px 15px;
  font-size: 13px;
  line-height: 19.5px;
  font-weight: 400;
  white-space: nowrap;
}
.reuse-button-selected {
  border-color: var(--blue-500);
  background: var(--blue-150);
  color: var(--blue-600);
}
.schedule-section { gap: 10px; }
.schedule-label {
  color: var(--gray-600);
  font-size: 12px;
  line-height: 18px;
  font-weight: 500;
}
.schedule-field {
  width: 100%;
  position: relative;
}
.schedule-select {
  width: 100%;
  height: 48px;
  border: 1px solid var(--gray-200);
  border-radius: 12px;
  background: var(--white);
  color: var(--gray-900);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 0 14px;
  text-align: left;
}
.schedule-select:focus {
  border-color: var(--blue-500);
  outline: none;
}
.schedule-date {
  min-width: 0;
  flex: 1 1 auto;
  color: var(--gray-900);
  font-size: 15px;
  line-height: 18px;
  font-weight: 400;
  white-space: nowrap;
}
.schedule-select svg {
  width: 18px;
  height: 18px;
  color: var(--black);
  flex: 0 0 auto;
}
.preview-screen {
  gap: 0;
  padding: 0 40px;
}
.preview-header-wrap {
  width: calc(100% + 80px);
  margin: 0 -40px;
  padding: 10px 28px 0 10px;
  flex: 0 0 auto;
}
.preview-header {
  width: 100%;
  height: 54px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px 14px;
  background: var(--white);
}
.preview-back {
  width: 24px;
  height: 24px;
  display: grid;
  place-items: center;
  padding: 0;
  background: transparent;
  color: #111827;
  flex: 0 0 auto;
}
.preview-title {
  flex: 1 1 auto;
  height: 49px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  overflow: hidden;
  font-family: inherit;
  font-weight: 700;
  white-space: nowrap;
}
.preview-title span:first-child {
  color: var(--blue-500);
  font-size: 10px;
  line-height: 15px;
  letter-spacing: 1.4px;
}
.preview-title span:last-child {
  color: #111827;
  font-size: 15px;
  line-height: normal;
}
.preview-spacer {
  width: 24px;
  height: 24px;
  flex: 0 0 auto;
}
.preview-scroll {
  width: calc(100% + 80px);
  margin: 30px -40px 0;
  flex: 1 1 auto;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}
.preview-scroll::-webkit-scrollbar { display: none; }
.preview-document {
  width: 402px;
  max-width: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 0 auto;
  padding-bottom: 24px;
}
.letterhead {
  width: 100%;
  background: var(--white);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 22px 40px 18px;
}
.letter-label {
  margin: 0 0 4px;
  color: #9ca3af;
  font-family: inherit;
  font-size: 11px;
  font-weight: 700;
  line-height: normal;
}
.letter-brand {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-bottom: 10px;
  white-space: nowrap;
}
.letter-brand strong {
  color: #111827;
  font-family: inherit;
  font-size: 18px;
  line-height: normal;
}
.letter-brand span {
  color: #6b7280;
  font-family: inherit;
  font-size: 14px;
  line-height: normal;
}
.product-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 6px;
  background: #f4f4f5;
  color: var(--blue-500);
  padding: 6px 11px;
  margin-bottom: 10px;
  font-family: inherit;
  font-size: 12px;
  font-weight: 700;
  line-height: normal;
}
.product-chip svg {
  width: 14px;
  height: 14px;
  color: #111827;
}
.written-date {
  margin: 0;
  color: #9ca3af;
  font-family: inherit;
  font-size: 11.5px;
  line-height: normal;
}
.preview-section {
  width: 100%;
  background: var(--white);
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 18px 40px;
  font-family: inherit;
}
.preview-section-compact {
  padding-inline: 24px;
}
.preview-section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  white-space: nowrap;
}
.preview-section-head strong {
  color: var(--blue-500);
  font-size: 11px;
  line-height: normal;
  letter-spacing: 1.32px;
}
.preview-section-head button {
  background: transparent;
  color: #9ca3af;
  font-size: 11.5px;
  line-height: normal;
  padding: 0;
}
.preview-row {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 8px 0;
  color: #111827;
}
.preview-row-label {
  color: #6b7280;
  font-size: 12.5px;
  line-height: normal;
  white-space: nowrap;
}
.preview-row-value {
  min-width: 0;
  color: #111827;
  font-size: 13px;
  font-weight: 700;
  line-height: normal;
  text-align: right;
  overflow-wrap: anywhere;
}
.preview-separator {
  width: 100%;
  height: 1px;
  border-top: 1px dashed #f3f4f6;
}
.preview-solid-separator {
  width: 100%;
  height: 1px;
  background: #f3f4f6;
}
.preview-pills {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 6px;
}
.preview-pill {
  border-radius: 99px;
  background: #f3f4f6;
  color: #374151;
  padding: 3px 9px;
  font-size: 11.5px;
  line-height: normal;
  white-space: nowrap;
}
.preview-quote {
  width: 100%;
  border-left: 3px solid var(--blue-500);
  border-radius: 8px;
  background: #f9fafb;
  color: #374151;
  padding: 14px 16px 14px 18px;
  font-size: 13px;
  line-height: 1.65;
}
.preview-quote p {
  margin: 0;
}
.plan-row {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 9px 0;
}
.plan-row strong {
  color: #111827;
  font-size: 13px;
  line-height: normal;
  white-space: nowrap;
}
.plan-qty {
  border-radius: 6px;
  background: #f4f4f5;
  color: var(--blue-500);
  padding: 3px 9px;
  font-size: 12px;
  font-weight: 700;
  line-height: normal;
  white-space: nowrap;
}
.price-preview {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 4px 0 10px;
}
.price-preview-row {
  display: flex;
  align-items: baseline;
  gap: 4px;
  font-weight: 700;
}
.price-preview-row strong {
  color: #111827;
  font-size: 28px;
  line-height: normal;
  letter-spacing: -0.56px;
}
.price-preview-row span {
  color: #6b7280;
  font-size: 14px;
  line-height: normal;
}
.price-preview p {
  margin: 0;
  color: #9ca3af;
  font-size: 11px;
  line-height: normal;
}
.reuse-preview-value {
  color: var(--blue-500);
}
.preview-footer {
  width: 354px;
  max-width: calc(100% - 8px);
  align-self: center;
  flex: 0 0 auto;
  border-top: 1px solid #f3f4f6;
  background: var(--white);
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 39px 20px 34px;
}
.send-button {
  width: 100%;
  min-height: 45px;
  border-radius: 12px;
  background: var(--blue-500);
  color: var(--white);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: inherit;
  font-size: 15px;
  font-weight: 700;
}
.send-button:disabled {
  background: var(--gray-100);
  color: var(--gray-400);
  cursor: not-allowed;
}
.restart-button {
  width: 100%;
  min-height: 45px;
  background: transparent;
  color: #6b7280;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: inherit;
  font-size: 13.5px;
}
.submit-error {
  width: 100%;
  margin: 4px 0 0;
  color: #dc2626;
  font-family: inherit;
  font-size: 12px;
  line-height: 18px;
  text-align: center;
}
/* In-card email popup. A dim wrapper covers the card interior (absolute, NOT
   a viewport-fixed overlay) and centers a small content-sized box — the
   "small popup over the preview" feel without a nested fixed modal.
   Colors key off the same blue/gray CSS vars, so the .onboarding-scope
   remap renders it monotone automatically. */
.email-panel {
  position: absolute;
  inset: 0;
  z-index: 30;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(10, 10, 11, 0.5);
}
.email-modal {
  width: min(360px, 88%);
  max-height: 100%;
  overflow-y: auto;
  background: var(--white);
  border-radius: 18px;
  padding: 28px 22px 22px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 48px rgba(10, 10, 11, 0.22);
}
.email-modal-title {
  margin: 0;
  color: var(--black);
  font-family: inherit;
  font-size: 18px;
  line-height: 26px;
  font-weight: 700;
  letter-spacing: -0.4px;
}
.email-modal-desc {
  margin: 10px 0 0;
  color: var(--gray-600);
  font-family: inherit;
  font-size: 13.5px;
  line-height: 20px;
  font-weight: 400;
}
.email-modal-input {
  width: 100%;
  height: 48px;
  margin-top: 18px;
  border: 1px solid var(--gray-200);
  border-radius: 12px;
  background: var(--white);
  color: var(--black);
  padding: 14px 15px;
  outline: none;
  font-size: 14px;
  line-height: normal;
  font-weight: 400;
}
.email-modal-input::placeholder {
  color: var(--gray-400);
  opacity: 1;
}
.email-modal-input:focus {
  border-color: var(--blue-500);
}
.email-modal-error {
  margin: 8px 0 0;
  color: #dc2626;
  font-family: inherit;
  font-size: 12px;
  line-height: 18px;
}
.email-consent {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-top: 12px;
  cursor: pointer;
}
.email-consent-checkbox {
  width: 16px;
  height: 16px;
  margin: 1px 0 0;
  flex: 0 0 auto;
  accent-color: var(--blue-500);
  cursor: pointer;
}
.email-consent-text {
  color: var(--gray-600);
  font-family: inherit;
  font-size: 12.5px;
  line-height: 18px;
  font-weight: 400;
}
.email-consent-policy {
  color: var(--blue-500);
  font-weight: 600;
  text-decoration: underline;
}
.email-consent-required {
  color: var(--gray-400);
}
.email-modal-submit:disabled {
  background: var(--gray-100);
  color: var(--gray-400);
  cursor: not-allowed;
}
.email-modal-actions {
  flex: 0 0 auto;
  display: flex;
  gap: 10px;
  margin-top: 22px;
}
.email-modal-cancel,
.email-modal-submit {
  flex: 1 1 0;
  min-height: 45px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: inherit;
  font-size: 15px;
  font-weight: 700;
}
.email-modal-cancel {
  background: var(--gray-100);
  color: var(--gray-600);
}
.email-modal-submit {
  background: var(--blue-500);
  color: var(--white);
}
@media (prefers-reduced-motion: no-preference) {
  .email-panel {
    animation: email-modal-fade 180ms ease-out both;
  }
  .email-modal {
    animation: email-modal-pop 220ms cubic-bezier(0.22, 1, 0.36, 1) both;
  }
}
.completion-screen {
  display: flex;
  flex-direction: column;
  padding: 0;
}
.completion-content {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 20px 28px;
  text-align: center;
}
.completion-logo {
  width: 132px;
  max-width: 42%;
  height: auto;
  margin: 0 0 18px;
}
.completion-tagline {
  margin: 0 0 30px;
  color: #000000;
  font-size: 15px;
  line-height: 1.5;
  font-weight: 600;
}
.completion-title {
  margin: 0 0 12px;
  color: var(--black);
  font-size: 26px;
  line-height: 1.3;
  font-weight: 700;
  letter-spacing: -0.6px;
}
.completion-title .completion-blue {
  color: var(--blue-500);
}
.completion-copy {
  margin: 0;
  color: var(--gray-600);
  font-size: 14px;
  line-height: 1.6;
  font-weight: 400;
}




.story-section, .content-type-section, .tone-section {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
.story-section { gap: 15px; }
.story-textarea {
  width: 100%;
  height: 195px;
  border: 1px solid var(--gray-200);
  border-radius: 12px;
  background: var(--white);
  color: var(--black);
  padding: 15px;
  outline: none;
  resize: none;
  font-family: inherit;
  font-size: 14px;
  line-height: 20px;
  font-weight: 400;
}
.story-textarea::placeholder {
  color: var(--gray-400);
  opacity: 1;
}
.story-textarea:focus {
  border-color: var(--blue-500);
}
.content-type-section { gap: 20px; }
.story-section-heading {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.story-section-heading h2 {
  margin: 0;
  color: #000000;
  font-size: 20px;
  line-height: 25px;
  font-weight: 600;
  letter-spacing: 0;
}
.story-section-heading p {
  margin: 0;
  color: var(--gray-400);
  font-size: 14px;
  line-height: 20px;
  font-weight: 400;
  letter-spacing: -0.042px;
}
.content-type-list {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.content-type-row {
  width: 100%;
  min-height: 48px;
  border: 1px solid var(--gray-200);
  border-radius: 12px;
  background: var(--white);
  color: var(--gray-400);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0 16px 0 15px;
}
.content-type-row-selected {
  border-color: var(--blue-500);
  background: var(--blue-150);
}
.content-type-main {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0;
  background: transparent;
  color: inherit;
  text-align: left;
}
.content-checkbox {
  width: 16px;
  height: 16px;
  border: 1px solid var(--gray-200);
  border-radius: 4px;
  background: var(--white);
  display: grid;
  place-items: center;
  color: var(--white);
  flex: 0 0 auto;
}
.content-type-row-selected .content-checkbox {
  border-color: var(--blue-500);
  background: var(--blue-500);
}
.content-type-label {
  overflow: hidden;
  color: inherit;
  font-size: 14px;
  line-height: normal;
  font-weight: 400;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.content-type-row-selected .content-type-label {
  color: var(--black);
}
.content-counter {
  height: 28px;
  display: flex;
  align-items: center;
  gap: 7px;
  flex: 0 0 auto;
}
.counter-button {
  width: 24px;
  height: 24px;
  border-radius: 999px;
  background: transparent;
  color: var(--gray-400);
  display: grid;
  place-items: center;
  padding: 0;
}
.content-type-row-selected .counter-button {
  color: var(--black);
}
.counter-button:disabled {
  color: var(--gray-200);
  cursor: not-allowed;
}
.counter-button svg {
  width: 16px;
  height: 16px;
}
.counter-value {
  width: 14px;
  color: var(--gray-400);
  font-size: 14px;
  line-height: 20px;
  font-weight: 500;
  text-align: center;
}
.content-type-row-selected .counter-value {
  color: var(--black);
}
.tone-section { gap: 15px; padding-bottom: 20px; }
.tone-field {
  width: 100%;
  position: relative;
}
.tone-other-input {
  width: 100%;
  height: 48px;
  border: 1px solid var(--gray-200);
  border-radius: 12px;
  background: var(--white);
  color: var(--black);
  padding: 14px 15px;
  outline: none;
  font-size: 14px;
  line-height: normal;
  font-weight: 400;
}
.tone-other-input::placeholder {
  color: var(--gray-400);
  opacity: 1;
}
.tone-other-input:focus {
  border-color: var(--blue-500);
}
.content-type-other-input {
  width: 100%;
  height: 48px;
  border: 1px solid var(--gray-200);
  border-radius: 12px;
  background: var(--white);
  color: var(--black);
  padding: 14px 15px;
  outline: none;
  font-size: 14px;
  line-height: normal;
  font-weight: 400;
}
.content-type-other-input::placeholder {
  color: var(--gray-400);
  opacity: 1;
}
.content-type-other-input:focus {
  border-color: var(--blue-500);
}
.field, .category-section, .metrics-section, .search-section, .product-section {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
.field, .product-section { gap: 6px; }
.field label, .section-title, .product-title {
  color: var(--gray-600);
  font-size: 15px;
  line-height: 1;
  font-weight: 700;
  letter-spacing: -0.075px;
}
.section-help {
  margin-top: 4px;
  color: var(--gray-400);
  font-size: 12px;
  line-height: 1;
  font-weight: 500;
  letter-spacing: -0.036px;
}
.field input, .product-section input, .metric-input, .select-shell {
  width: 100%;
  height: 48px;
  border: 1px solid var(--gray-200);
  border-radius: 12px;
  background: var(--white);
  color: var(--black);
  padding: 14px 15px;
  outline: none;
  font-size: 14px;
  line-height: normal;
  font-weight: 400;
}
.field input::placeholder, .product-section input::placeholder, .metric-input::placeholder {
  color: var(--gray-400);
  opacity: 1;
}
.field input:focus, .product-section input:focus, .metric-input:focus, .select-shell:focus-within {
  border-color: var(--blue-500);
}
.divider {
  width: 100%;
  height: 1px;
  background: var(--gray-200);
  flex: 0 0 auto;
}
.search-section { gap: 20px; }
.results-label {
  width: 100%;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  white-space: nowrap;
}
.results-label h2 {
  margin: 0;
  color: var(--gray-600);
  font-size: 15px;
  line-height: 1;
  font-weight: 700;
  letter-spacing: -0.075px;
}
.results-label span {
  color: var(--gray-400);
  font-size: 12px;
  line-height: 1;
  font-weight: 500;
  letter-spacing: -0.036px;
}
.brand-card {
  width: 100%;
  height: 73px;
  border: 1px solid var(--blue-500);
  border-radius: 8px;
  background: var(--blue-150);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px 10px 25px;
  text-align: left;
}
.brand-copy {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
}
.brand-name-row {
  display: flex;
  align-items: center;
  gap: 5px;
}
.brand-name {
  color: #000000;
  font-size: 15px;
  line-height: 1;
  font-weight: 700;
  letter-spacing: -0.075px;
}
.verified-mark {
  width: 14px;
  height: 14px;
  border-radius: 999px;
  background: #000000;
  color: var(--white);
  display: grid;
  place-items: center;
  font-size: 9px;
  line-height: 1;
  font-weight: 700;
}
.brand-meta {
  color: var(--gray-400);
  font-size: 12px;
  line-height: 1;
  font-weight: 500;
  letter-spacing: -0.036px;
  white-space: nowrap;
}
.selected-check {
  width: 20px;
  height: 20px;
  border-radius: 999px;
  background: var(--blue-500);
  color: var(--white);
  display: grid;
  place-items: center;
  flex: 0 0 auto;
}
.product-label {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.platform-row {
  width: 100%;
  height: 38px;
  display: flex;
  align-items: center;
  gap: 30px;
}
.platform-button {
  height: 38px;
  border: 1px solid var(--gray-200);
  border-radius: 999px;
  background: var(--white);
  color: var(--gray-900);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 1px 15px;
  font-size: 13px;
  line-height: 19.5px;
  font-weight: 400;
  white-space: nowrap;
}
.platform-button-selected {
  border-color: var(--blue-500);
  background: var(--blue-150);
  color: var(--blue-600);
}
.platform-dot {
  width: 14px;
  height: 14px;
  border-radius: 999px;
  background: var(--blue-500);
  box-shadow: inset 0 0 0 3px var(--white);
  flex: 0 0 auto;
}
.platform-button svg {
  width: 14px;
  height: 14px;
  flex: 0 0 auto;
}
.category-section { gap: 12px; }
.category-grid {
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  gap: 6px 19px;
  align-items: center;
}
.category-button {
  width: auto;
  min-width: 56px;
  height: 48px;
  border: 1px solid var(--gray-200);
  border-radius: 16px;
  background: var(--white);
  color: var(--gray-400);
  padding: 0 15px;
  font-size: 14px;
  line-height: normal;
  font-weight: 400;
  white-space: nowrap;
}
.category-button-selected {
  border-color: var(--blue-500);
  background: var(--blue-150);
  color: var(--blue-600);
}
.metrics-section { gap: 20px; }
.metric-heading {
  display: flex;
  flex-direction: column;
}
.metric-note {
  color: var(--gray-400);
  font-size: 12px;
  line-height: 1;
  font-weight: 500;
  letter-spacing: -0.036px;
}
.metric-field {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  position: relative;
}
.metric-label {
  color: var(--gray-600);
  font-size: 15px;
  line-height: 1;
  font-weight: 700;
  letter-spacing: -0.075px;
}
.select-shell {
  border-color: var(--gray-400);
  border-radius: 16px;
  padding: 0 15px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  position: relative;
  cursor: pointer;
  text-align: left;
}
.select-value {
  flex: 1 1 auto;
  color: var(--gray-400);
  font-size: 14px;
  line-height: normal;
  white-space: nowrap;
}
.select-value-selected {
  color: var(--black);
}
.select-shell svg {
  width: 18px;
  height: 18px;
  color: var(--black);
  flex: 0 0 auto;
}
.select-menu {
  position: absolute;
  z-index: 10;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  border: 1px solid var(--gray-200);
  border-radius: 14px;
  background: var(--white);
  box-shadow: 0 10px 28px rgba(10, 10, 11, 0.1);
  overflow: hidden;
}
.select-menu-up {
  top: auto;
  bottom: calc(100% + 6px);
}
.select-option {
  width: 100%;
  min-height: 42px;
  background: var(--white);
  color: var(--black);
  display: flex;
  align-items: center;
  padding: 0 15px;
  font-size: 14px;
  text-align: left;
}
.select-option:hover,
.select-option-selected {
  background: var(--blue-150);
  color: var(--blue-600);
}
.metric-input {
  border-color: var(--gray-600) !important;
  border-radius: 16px !important;
}
.bottom-action {
  width: 100%;
  align-self: center;
  flex: 0 0 auto;
  padding: 12px 0 60px;
  background: linear-gradient(0deg, var(--white) 60%, rgba(255, 255, 255, 0) 100%);
}
.next-button {
  width: 100%;
  height: 52px;
  border-radius: 14px;
  background: var(--blue-500);
  color: var(--white);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1px 19px;
  font-family: inherit;
  font-size: 15px;
  line-height: normal;
  font-weight: 400;
  letter-spacing: -0.15px;
}
.next-button:disabled {
  background: var(--gray-100);
  color: var(--gray-400);
  cursor: not-allowed;
}
@media (max-width: 374px) {
  .mobile-screen { padding-inline: 12px; }
  .platform-row, .field, .category-section, .metrics-section, .bottom-action, .search-section, .product-section, .story-section, .content-type-section, .tone-section, .price-section, .reuse-section, .schedule-section { width: 100%; }
  .category-grid { gap: 6px 10px; }
  .category-button { padding-inline: 10px; }
}


.mobile-screen { width: 100%; height: 100%; min-height: 0; }
.completion-close {
  width: 100%;
  margin-top: 36px;
  min-height: 52px;
  border-radius: 14px;
  background: var(--black);
  color: var(--white);
  font-size: 15px;
  font-weight: 600;
  letter-spacing: -0.15px;
}
@media (prefers-reduced-motion: no-preference) {
  .completion-content > * { animation: completion-rise 520ms ease-out both; }
  .completion-tagline { animation-delay: 80ms; }
  .completion-title { animation-delay: 160ms; }
  .completion-copy { animation-delay: 240ms; }
  .completion-close { animation-delay: 320ms; }
}

}
`;

function Stepper({ step }: { step: Step }) {
  return (
    <div className="stepper" data-name="stepper">
      <div className="stepper-bars" aria-hidden="true">
        <span
          className={`stepper-bar ${
            step === 1 ? "stepper-bar-active" : "stepper-bar-done"
          }`}
        />
        <span
          className={`stepper-bar ${
            step === 2 ? "stepper-bar-active" : step >= 3 ? "stepper-bar-done" : ""
          }`}
        />
        <span
          className={`stepper-bar ${
            step === 3 ? "stepper-bar-active" : step === 4 ? "stepper-bar-done" : ""
          }`}
        />
        <span className={`stepper-bar ${step === 4 ? "stepper-bar-active" : ""}`} />
      </div>
      <p className="stepper-count">
        <strong>{step}</strong>
        <span>/4</span>
      </p>
    </div>
  );
}

function MetricSelect({
  id,
  label,
  options,
  value,
  isOpen,
  opensUp,
  onOpen,
  onSelect,
}: {
  id: SelectKey;
  label: string;
  options: string[];
  value: string;
  isOpen: boolean;
  opensUp: boolean;
  onOpen: (id: SelectKey) => void;
  onSelect: (id: SelectKey, value: string) => void;
}) {
  const hasValue = value !== "";

  return (
    <div className="metric-field" data-select-id={id}>
      <div className="metric-label">{label}</div>
      <button
        className="select-shell"
        type="button"
        onClick={() => onOpen(id)}
        aria-expanded={isOpen}
      >
        <span className={`select-value ${hasValue ? "select-value-selected" : ""}`}>
          {value || "여기서 선택해주세요"}
        </span>
        <ChevronDown />
      </button>
      {isOpen && (
        <div className={`select-menu ${opensUp ? "select-menu-up" : ""}`}>
          {options.map((option) => (
            <button
              className={`select-option ${
                value === option ? "select-option-selected" : ""
              }`}
              key={option}
              type="button"
              onClick={() => onSelect(id, option)}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function PreviewRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <>
      <div className="preview-row">
        <span className="preview-row-label">{label}</span>
        <div className="preview-row-value">{children}</div>
      </div>
      <div className="preview-separator" />
    </>
  );
}

function formatNumber(value: string) {
  if (!value) {
    return "-";
  }
  return Number(value).toLocaleString("ko-KR");
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function formatWrittenDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}.${month}.${day}`;
}

function formatDateOption(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const weekday = weekdayLabels[date.getDay()];

  return `${year}.${month}.${day} (${weekday})`;
}

function buildUploadDateOptions() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return Array.from({ length: 14 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() + index + 1);
    return formatDateOption(date);
  });
}

function OnboardingFlow({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<Step>(1);
  const uploadDateOptions = useMemo(() => buildUploadDateOptions(), []);
  const [brandName, setBrandName] = useState("");
  const [productName, setProductName] = useState("");
  const [platform, setPlatform] = useState<Platform>("youtube");
  const [profileName, setProfileName] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [openSelect, setOpenSelect] = useState<SelectKey | null>(null);
  const [upwardSelects, setUpwardSelects] = useState<Set<SelectKey>>(new Set());
  const [selectValues, setSelectValues] = useState<Record<SelectKey, string>>({
    averageLikes: "",
    averageSaves: "",
    averageShares: "",
    averageViews: "",
    collabCount: "",
  });
  const [profileCount, setProfileCount] = useState("");
  const [peakViews, setPeakViews] = useState("");
  const [storyText, setStoryText] = useState("");
  const [isToneOpen, setIsToneOpen] = useState(false);
  const [toneOpensUp, setToneOpensUp] = useState(false);
  const [contentTone, setContentTone] = useState<ToneOption | "">("");
  const [contentToneOther, setContentToneOther] = useState("");
  const [contentTypeOther, setContentTypeOther] = useState("");
  const [expectedPrice, setExpectedPrice] = useState("");
  const [reuseAllowed, setReuseAllowed] = useState<boolean | null>(null);
  const [uploadDate, setUploadDate] = useState(() => buildUploadDateOptions()[0]);
  const [isUploadDateOpen, setIsUploadDateOpen] = useState(false);
  const [uploadDateOpensUp, setUploadDateOpensUp] = useState(false);
  const [isEmailOpen, setIsEmailOpen] = useState(false);
  const [contactEmail, setContactEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [contentTypes, setContentTypes] = useState<
    Record<string, { selected: boolean; count: number }>
  >(() =>
    Object.fromEntries(
      contentTypeOptions.map((option) => [
        option,
        { selected: false, count: 0 },
      ]),
    ),
  );
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // While the in-card email panel is open, ESC should close only the panel.
  // The shell closes the whole onboarding via a bubble-phase document listener;
  // a capture-phase listener here runs first and stops the event from reaching it.
  useEffect(() => {
    if (!isEmailOpen) return;
    function onEsc(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.stopPropagation();
        if (isSaving) return;
        setIsEmailOpen(false);
        setEmailError("");
      }
    }
    document.addEventListener("keydown", onEsc, true);
    return () => document.removeEventListener("keydown", onEsc, true);
  }, [isEmailOpen, isSaving]);

  const hasBrandResult =
    isBrandSearchEnabled &&
    brandName.trim().length > 0 &&
    brand.name.toLowerCase().includes(brandName.trim().toLowerCase());
  const canStep1Next =
    brandName.trim().length > 0 && productName.trim().length > 0;

  const platformCopy = useMemo(
    () =>
      platform === "youtube"
        ? {
            nameLabel: "채널명",
            countLabel: "구독자 수",
            metricIntro: "최근 관련 컨텐츠 3개의 평균 기준으로 작성해주세요!",
            extraMetricIntro: "*롱폼 컨텐츠 중심입니다.",
            averageLabel: "최근 3개 컨텐츠의 평균 조회수",
            peakLabel: "가장 높은 조회수",
          }
        : {
            nameLabel: "계정명 / 활동명",
            countLabel: "팔로워 수",
            metricIntro: "최근 관련 컨텐츠 3개의 평균 기준으로 작성해주세요!",
            extraMetricIntro: "",
            averageLabel: "평균 좋아요 수",
            peakLabel: "평균 저장 수",
          },
    [platform],
  );

  const hasMetricValue = (id: SelectKey) => selectValues[id] !== "";
  const canStep2Next =
    profileName.trim().length > 0 &&
    profileCount.trim().length > 0 &&
    selectedCategories.length > 0 &&
    (platform === "instagram"
      ? hasMetricValue("averageLikes") &&
        hasMetricValue("averageShares") &&
        hasMetricValue("collabCount")
      : hasMetricValue("averageViews") &&
        peakViews.trim().length > 0 &&
        hasMetricValue("collabCount"));
  const hasSelectedContentType = Object.values(contentTypes).some(
    (option) => option.selected && option.count > 0,
  );
  const needsContentTypeOther = contentTypes[contentTypeOtherLabel].selected;
  const canStep3Next =
    storyText.trim().length > 0 &&
    hasSelectedContentType &&
    (!needsContentTypeOther || contentTypeOther.trim().length > 0) &&
    contentTone !== "" &&
    (contentTone !== "기타: 직접 입력" || contentToneOther.trim().length > 0);
  const canStep4Next =
    expectedPrice.trim().length > 0 && reuseAllowed !== null && uploadDate !== "";
  const selectedContentPlans = contentTypeOptions
    .map((label) => ({
      label: label === contentTypeOtherLabel ? contentTypeOther.trim() || label : label,
      count: contentTypes[label].count,
      selected: contentTypes[label].selected,
    }))
    .filter((item) => item.selected && item.count > 0);
  const previewTone =
    contentTone === "기타: 직접 입력"
      ? contentToneOther.trim() || contentTone
      : contentTone || "-";
  const writtenDate = formatWrittenDate();
  const canSubmitProposal = canStep1Next && canStep2Next && canStep3Next && canStep4Next;

  function toggleCategory(category: string) {
    setSelectedCategories((current) => {
      if (current.includes(category)) {
        return current.filter((item) => item !== category);
      }
      if (current.length >= 2) {
        return current;
      }
      return [...current, category];
    });
  }

  function getMetricOptions(id: SelectKey) {
    return id === "collabCount" ? collabOptions : rangeOptions;
  }

  function toggleSelect(id: SelectKey) {
    setOpenSelect((current) => {
      if (current === id) {
        return null;
      }

      requestAnimationFrame(() => {
        const scrollArea = scrollAreaRef.current;
        const field = document.querySelector<HTMLElement>(`[data-select-id="${id}"]`);

        if (!scrollArea || !field) {
          return;
        }

        const fieldRect = field.getBoundingClientRect();
        const areaRect = scrollArea.getBoundingClientRect();
        const menuHeight = getMetricOptions(id).length * 42 + 2;
        const shouldOpenUp =
          fieldRect.bottom + 6 + menuHeight > areaRect.bottom &&
          fieldRect.top - areaRect.top > menuHeight;

        setUpwardSelects((current) => {
          const next = new Set(current);
          if (shouldOpenUp) {
            next.add(id);
          } else {
            next.delete(id);
          }
          return next;
        });
      });

      return id;
    });
  }

  function toggleToneSelect() {
    setIsToneOpen((current) => {
      if (current) {
        return false;
      }

      requestAnimationFrame(() => {
        const scrollArea = scrollAreaRef.current;
        const field = document.querySelector<HTMLElement>("[data-tone-select]");

        if (!scrollArea || !field) {
          return;
        }

        const fieldRect = field.getBoundingClientRect();
        const areaRect = scrollArea.getBoundingClientRect();
        const menuHeight = toneOptions.length * 42 + 2;

        setToneOpensUp(
          fieldRect.bottom + 6 + menuHeight > areaRect.bottom &&
            fieldRect.top - areaRect.top > menuHeight,
        );
      });

      return true;
    });
  }

  function toggleUploadDateSelect() {
    setIsUploadDateOpen((current) => {
      if (current) {
        return false;
      }

      requestAnimationFrame(() => {
        const scrollArea = scrollAreaRef.current;
        const field = document.querySelector<HTMLElement>("[data-upload-date-select]");

        if (!scrollArea || !field) {
          return;
        }

        const fieldRect = field.getBoundingClientRect();
        const areaRect = scrollArea.getBoundingClientRect();
        const menuHeight = uploadDateOptions.length * 42 + 2;

        setUploadDateOpensUp(
          fieldRect.bottom + 6 + menuHeight > areaRect.bottom &&
            fieldRect.top - areaRect.top > menuHeight,
        );
      });

      return true;
    });
  }

  function selectMetric(id: SelectKey, value: string) {
    setSelectValues((current) => ({ ...current, [id]: value }));
    setOpenSelect(null);
  }

  function onlyDigits(value: string) {
    return value.replace(/\D/g, "");
  }

  function toggleContentType(label: string) {
    setContentTypes((current) => {
      const nextSelected = !current[label].selected;

      if (label === contentTypeOtherLabel && !nextSelected) {
        setContentTypeOther("");
      }

      return {
        ...current,
        [label]: {
          selected: nextSelected,
          count: nextSelected ? Math.max(1, current[label].count) : 0,
        },
      };
    });
  }

  function changeContentCount(label: string, delta: number) {
    setContentTypes((current) => {
      const nextCount = Math.max(0, Math.min(99, current[label].count + delta));

      return {
        ...current,
        [label]: {
          selected: nextCount > 0,
          count: nextCount,
        },
      };
    });
  }

  function goBack() {
    setStep((current) =>
      current === 5
        ? 4
        : current === 4
          ? 3
          : current === 3
            ? 2
            : current === 2
              ? 1
              : 1,
    );
  }

  function openEmail() {
    if (!canSubmitProposal) {
      return;
    }
    setEmailError("");
    setIsEmailOpen(true);
  }

  function closeEmail() {
    if (isSaving) {
      return;
    }
    setIsEmailOpen(false);
    setEmailError("");
  }

  // Extract digits then parse. Returns null when there's nothing parseable —
  // callers coerce to 0 for NOT NULL integer columns.
  function toInt(value: string): number | null {
    const digits = value.replace(/\D/g, "");
    if (digits === "") {
      return null;
    }
    const parsed = parseInt(digits, 10);
    return Number.isNaN(parsed) ? null : parsed;
  }

  async function confirmEmail() {
    if (isSaving) {
      return;
    }
    const trimmedEmail = contactEmail.trim();
    if (trimmedEmail.length === 0) {
      setEmailError("이메일을 입력해주세요.");
      return;
    }
    if (!isValidEmail(trimmedEmail)) {
      setEmailError("올바른 이메일 형식이 아니에요.");
      return;
    }
    if (!privacyConsent) {
      setEmailError("개인정보 수집에 동의해주세요.");
      return;
    }

    const contentTypesPayload = contentTypeOptions
      .filter((label) => contentTypes[label].selected && contentTypes[label].count > 0)
      .map((label) => ({ label, count: contentTypes[label].count }));

    const payload = {
      brand_name: brandName,
      product_name: productName,
      platform,
      profile_name: profileName,
      profile_count: toInt(profileCount) ?? 0,
      selected_categories: selectedCategories,
      avg_likes: selectValues.averageLikes || null,
      avg_saves: selectValues.averageSaves || null,
      avg_shares: selectValues.averageShares || null,
      avg_views: selectValues.averageViews || null,
      peak_views: toInt(peakViews),
      collab_count: selectValues.collabCount,
      story_text: storyText,
      content_types: contentTypesPayload,
      content_type_other: needsContentTypeOther
        ? contentTypeOther.trim() || null
        : null,
      content_tone: contentTone,
      content_tone_other:
        contentTone === "기타: 직접 입력" ? contentToneOther.trim() || null : null,
      expected_price: toInt(expectedPrice) ?? 0,
      reuse_allowed: reuseAllowed ?? false,
      upload_date: uploadDate || null,
      contact_email: trimmedEmail,
      privacy_consent: privacyConsent,
      consent_at: new Date().toISOString(),
    };

    setIsSaving(true);
    // No .select() — RLS blocks anon reads, so a select would return an empty
    // set and surface as a false error. We only care whether the insert errored.
    const { error } = await supabase.from("proposal_submissions").insert(payload);
    setIsSaving(false);

    if (error) {
      setEmailError("전송에 실패했어요. 잠시 후 다시 시도해주세요.");
      return;
    }

    setIsEmailOpen(false);
    setStep(6);
  }


  return (
    <section
          className={`mobile-screen ${step === 5 ? "preview-screen" : ""} ${
            step === 6 ? "completion-screen" : ""
          }`}
          data-name={`역제안서${step}`}
        >
          {step !== 5 && step !== 6 && (
            <header className="back-bar" data-name="back-bar">
              <button
                className="back-button"
                type="button"
                aria-label="뒤로 가기"
                onClick={goBack}
              >
                <ChevronLeft size={24} strokeWidth={2.4} />
              </button>
              <Stepper step={step} />
            </header>
          )}

          {step === 1 && (
            <>
              <div className="content brand-content">
                <section className="title-block">
                  <h1>어떤 제품에 제안하시겠어요?</h1>
                  <p>제안할 브랜드와 제품을 입력해주세요</p>
                </section>

                <label className="field" htmlFor="brand-name">
                  <span className="section-title">브랜드명</span>
                  <input
                    id="brand-name"
                    value={brandName}
                    onChange={(event) => setBrandName(event.target.value)}
                    placeholder="예: 리피치"
                    autoComplete="off"
                  />
                </label>

                <label className="product-section" htmlFor="product-name">
                  <span className="product-label">
                    <span className="product-title">제품명</span>
                    <span className="section-help">*정확하게 입력해주세요</span>
                  </span>
                  <input
                    id="product-name"
                    value={productName}
                    onChange={(event) => setProductName(event.target.value)}
                    placeholder="예: 화산 세럼"
                    autoComplete="off"
                  />
                </label>

                {isBrandSearchEnabled && (
                  <section className="search-section">
                  <div className="results-label">
                    <h2>검색 결과</h2>
                    <span>{hasBrandResult ? "1건" : "건"}</span>
                  </div>

                  {hasBrandResult && (
                    <>
                      <button className="brand-card" type="button">
                        <span className="brand-copy">
                          <span className="brand-name-row">
                            <span className="brand-name">{brand.name}</span>
                            <span className="verified-mark">✓</span>
                          </span>
                          <span className="brand-meta">{brand.meta}</span>
                        </span>
                        <span className="selected-check" aria-hidden="true">
                          <Check size={13} strokeWidth={3} />
                        </span>
                      </button>

                      <div className="divider" />

                    </>
                  )}
                  </section>
                )}
              </div>

              <div className="bottom-action" data-name="button">
                <button
                  className="next-button"
                  type="button"
                  disabled={!canStep1Next}
                  onClick={() => setStep(2)}
                >
                  다음
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="scroll-area" data-name="scroll area" ref={scrollAreaRef}>
                <div className="content">
                  <section className="title-block" data-name="문구">
                    <h1>프로필을 설정해주세요</h1>
                    <p>광고할 플랫폼을 하나만 골라주세요</p>
                  </section>

                  <div className="platform-row" data-name="플랫폼 버튼">
                    <button
                      className={`platform-button ${
                        platform === "instagram" ? "platform-button-selected" : ""
                      }`}
                      type="button"
                      onClick={() => setPlatform("instagram")}
                    >
                      {platform === "instagram" && <span className="platform-dot" />}
                      <InstagramIcon />
                      <span>Instagram</span>
                    </button>

                    <button
                      className={`platform-button ${
                        platform === "youtube" ? "platform-button-selected" : ""
                      }`}
                      type="button"
                      onClick={() => setPlatform("youtube")}
                    >
                      {platform === "youtube" && <span className="platform-dot" />}
                      <YoutubeIcon />
                      <span>YouTube</span>
                    </button>
                  </div>

                  <div className="field">
                    <label htmlFor="profile-name">{platformCopy.nameLabel}</label>
                    <input
                      id="profile-name"
                      value={profileName}
                      onChange={(event) => setProfileName(event.target.value)}
                      placeholder="예: repitch_official"
                      autoComplete="off"
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="profile-count">{platformCopy.countLabel}</label>
                    <input
                      id="profile-count"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={profileCount}
                      onChange={(event) =>
                        setProfileCount(onlyDigits(event.target.value))
                      }
                      placeholder="숫자로 정확히 입력"
                      autoComplete="off"
                    />
                  </div>

                  <section className="category-section">
                    <div>
                      <div className="section-title">카테고리</div>
                      <div className="section-help">최대 2개까지 선택 가능</div>
                    </div>
                    <div className="category-grid">
                      {categories.map((category) => (
                        <button
                          className={`category-button ${
                            selectedCategories.includes(category)
                              ? "category-button-selected"
                              : ""
                          }`}
                          key={category}
                          type="button"
                          onClick={() => toggleCategory(category)}
                        >
                          {category}
                        </button>
                      ))}
                    </div>
                  </section>

                  <section className="metrics-section">
                    <div className="metric-heading">
                      <div className="section-title">콘텐츠 지표</div>
                      <div className="section-help">{platformCopy.metricIntro}</div>
                    </div>
                    {platformCopy.extraMetricIntro && (
                      <div className="metric-note">{platformCopy.extraMetricIntro}</div>
                    )}

                    {platform === "instagram" ? (
                      <>
                        <MetricSelect
                          id="averageLikes"
                          label="평균 좋아요 수"
                          options={getMetricOptions("averageLikes")}
                          value={selectValues.averageLikes}
                          isOpen={openSelect === "averageLikes"}
                          opensUp={upwardSelects.has("averageLikes")}
                          onOpen={toggleSelect}
                          onSelect={selectMetric}
                        />
                        <MetricSelect
                          id="averageSaves"
                          label="평균 저장 수"
                          options={getMetricOptions("averageSaves")}
                          value={selectValues.averageSaves}
                          isOpen={openSelect === "averageSaves"}
                          opensUp={upwardSelects.has("averageSaves")}
                          onOpen={toggleSelect}
                          onSelect={selectMetric}
                        />
                        <MetricSelect
                          id="averageShares"
                          label="평균 공유 수"
                          options={getMetricOptions("averageShares")}
                          value={selectValues.averageShares}
                          isOpen={openSelect === "averageShares"}
                          opensUp={upwardSelects.has("averageShares")}
                          onOpen={toggleSelect}
                          onSelect={selectMetric}
                        />
                        <MetricSelect
                          id="collabCount"
                          label="최근 3개월 브랜드 협업 횟수"
                          options={getMetricOptions("collabCount")}
                          value={selectValues.collabCount}
                          isOpen={openSelect === "collabCount"}
                          opensUp={upwardSelects.has("collabCount")}
                          onOpen={toggleSelect}
                          onSelect={selectMetric}
                        />
                      </>
                    ) : (
                      <>
                        <MetricSelect
                          id="averageViews"
                          label="최근 3개 컨텐츠의 평균 조회수"
                          options={getMetricOptions("averageViews")}
                          value={selectValues.averageViews}
                          isOpen={openSelect === "averageViews"}
                          opensUp={upwardSelects.has("averageViews")}
                          onOpen={toggleSelect}
                          onSelect={selectMetric}
                        />
                        <div className="metric-field">
                          <label className="metric-label" htmlFor="peak-metric">
                            가장 높은 조회수
                          </label>
                          <input
                            className="metric-input"
                            id="peak-metric"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={peakViews}
                            onChange={(event) =>
                              setPeakViews(onlyDigits(event.target.value))
                            }
                            placeholder="숫자로 입력해 주세요"
                          />
                        </div>
                        <MetricSelect
                          id="collabCount"
                          label="최근 3개월 브랜드 협업 횟수"
                          options={getMetricOptions("collabCount")}
                          value={selectValues.collabCount}
                          isOpen={openSelect === "collabCount"}
                          opensUp={upwardSelects.has("collabCount")}
                          onOpen={toggleSelect}
                          onSelect={selectMetric}
                        />
                      </>
                    )}
                  </section>
                </div>
              </div>

              <div className="bottom-action" data-name="button">
                <button
                  className="next-button"
                  type="button"
                  disabled={!canStep2Next}
                  onClick={() => setStep(3)}
                >
                  다음
                </button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="scroll-area" data-name="scroll area" ref={scrollAreaRef}>
                <div className="content story-content">
                  <section className="title-block story-title" data-name="문구">
                    <h1>
                      해당 제품/서비스에 대한 <br />
                      본인의 서사를 알려주세요
                    </h1>
                    <p>자세할수록 성사 확률이 높아져요</p>
                  </section>

                  <label className="story-section" htmlFor="story-text">
                    <textarea
                      className="story-textarea"
                      id="story-text"
                      value={storyText}
                      onChange={(event) => setStoryText(event.target.value)}
                      placeholder="예 :  [~한 상황에서] 해당 제품/서비스를 썼는데, [어떤 구체적인 효과]가 있었다. 내 팔로워들에게 [해당 제품의 어떤 점]을 어필하며 광고하고 싶다. "
                    />
                  </label>

                  <section className="content-type-section">
                    <div className="story-section-heading">
                      <h2>컨텐츠 유형과 개수를 선택해주세요</h2>
                      <p>
                        컨텐츠 유형에 따라 광고 단가가 달라질 수 있어요
                        <br />
                        중복 선택 가능해요
                      </p>
                    </div>

                    <div className="content-type-list">
                      {contentTypeOptions.map((label) => {
                        const option = contentTypes[label];

                        return (
                          <div key={label} className="content-type-list">
                            <div
                              className={`content-type-row ${
                                option.selected ? "content-type-row-selected" : ""
                              }`}
                            >
                              <button
                                className="content-type-main"
                                type="button"
                                onClick={() => toggleContentType(label)}
                              >
                                <span className="content-checkbox" aria-hidden="true">
                                  {option.selected && (
                                    <Check size={11} strokeWidth={3} />
                                  )}
                                </span>
                                <span className="content-type-label">{label}</span>
                              </button>

                              <div
                                className="content-counter"
                                aria-label={`${label} 개수`}
                              >
                                <button
                                  className="counter-button"
                                  type="button"
                                  aria-label={`${label} 개수 줄이기`}
                                  disabled={option.count <= 0}
                                  onClick={() => changeContentCount(label, -1)}
                                >
                                  <Minus />
                                </button>
                                <span className="counter-value">{option.count}</span>
                                <button
                                  className="counter-button"
                                  type="button"
                                  aria-label={`${label} 개수 늘리기`}
                                  onClick={() => changeContentCount(label, 1)}
                                >
                                  <Plus />
                                </button>
                              </div>
                            </div>
                            {label === contentTypeOtherLabel && option.selected && (
                              <input
                                className="content-type-other-input"
                                value={contentTypeOther}
                                onChange={(event) =>
                                  setContentTypeOther(event.target.value)
                                }
                                placeholder="컨텐츠 유형을 입력해주세요"
                                autoComplete="off"
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </section>

                  <section className="tone-section">
                    <div className="story-section-heading">
                      <h2>컨텐츠 성격을 선택해주세요</h2>
                    </div>
                    <div className="tone-field" data-tone-select>
                      <button
                        className="select-shell"
                        type="button"
                        aria-expanded={isToneOpen}
                        onClick={toggleToneSelect}
                      >
                        <span
                          className={`select-value ${
                            contentTone ? "select-value-selected" : ""
                          }`}
                        >
                          {contentTone || "카테고리를 선택해주세요."}
                        </span>
                        <ChevronDown />
                      </button>
                      {isToneOpen && (
                        <div
                          className={`select-menu ${
                            toneOpensUp ? "select-menu-up" : ""
                          }`}
                        >
                          {toneOptions.map((option) => (
                            <button
                              className={`select-option ${
                                contentTone === option ? "select-option-selected" : ""
                              }`}
                              key={option}
                              type="button"
                              onClick={() => {
                                setContentTone(option);
                                if (option !== "기타: 직접 입력") {
                                  setContentToneOther("");
                                }
                                setIsToneOpen(false);
                              }}
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {contentTone === "기타: 직접 입력" && (
                      <input
                        className="tone-other-input"
                        value={contentToneOther}
                        onChange={(event) => setContentToneOther(event.target.value)}
                        placeholder="컨텐츠 성격을 입력해주세요"
                        autoComplete="off"
                      />
                    )}
                  </section>
                </div>
              </div>

              <div className="bottom-action" data-name="button">
                <button
                  className="next-button"
                  type="button"
                  disabled={!canStep3Next}
                  onClick={() => setStep(4)}
                >
                  다음
                </button>
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <div className="scroll-area" data-name="scroll area" ref={scrollAreaRef}>
                <div className="content final-content">
                  <section className="price-section">
                    <div className="final-heading">
                      <h2>원하시는 희망 단가를 알려주세요</h2>
                    </div>
                    <label className="price-field" htmlFor="expected-price">
                      <input
                        className="price-input"
                        id="expected-price"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={expectedPrice}
                        onChange={(event) =>
                          setExpectedPrice(onlyDigits(event.target.value))
                        }
                        placeholder="0"
                        autoComplete="off"
                      />
                      <span className="price-unit">만 원</span>
                    </label>
                  </section>

                  <section className="reuse-section">
                    <div className="final-heading">
                      <h2>
                        컨텐츠의 2차 활용 허용 여부를
                        <br />
                        알려주세요
                      </h2>
                      <p>
                        허용하실 경우, 브랜드 측의 활용 여부에 따라 추가 수익이
                        발생할 수 있어요.
                      </p>
                    </div>

                    <div className="reuse-row">
                      <button
                        className={`reuse-button ${
                          reuseAllowed === true ? "reuse-button-selected" : ""
                        }`}
                        type="button"
                        onClick={() => setReuseAllowed(true)}
                      >
                        예, 동의합니다
                      </button>
                      <button
                        className={`reuse-button ${
                          reuseAllowed === false ? "reuse-button-selected" : ""
                        }`}
                        type="button"
                        onClick={() => setReuseAllowed(false)}
                      >
                        아니오, 동의하지 않습니다
                      </button>
                    </div>
                  </section>

                  <section className="schedule-section">
                    <div className="final-heading">
                      <h2>
                        희망하시는 컨텐츠 업로드 일정을
                        <br />
                        선택해주세요
                      </h2>
                    </div>

                    <div className="schedule-field" data-upload-date-select>
                      <div className="schedule-label">콘텐츠 마감일 (1차 기준)</div>
                      <button
                        className="schedule-select"
                        type="button"
                        aria-expanded={isUploadDateOpen}
                        onClick={toggleUploadDateSelect}
                      >
                        <Calendar />
                        <span className="schedule-date">{uploadDate}</span>
                        <ChevronDown />
                      </button>
                      {isUploadDateOpen && (
                        <div
                          className={`select-menu ${
                            uploadDateOpensUp ? "select-menu-up" : ""
                          }`}
                        >
                          {uploadDateOptions.map((option) => (
                            <button
                              className={`select-option ${
                                uploadDate === option ? "select-option-selected" : ""
                              }`}
                              key={option}
                              type="button"
                              onClick={() => {
                                setUploadDate(option);
                                setIsUploadDateOpen(false);
                              }}
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </section>
                </div>
              </div>

              <div className="bottom-action" data-name="button">
                <button
                  className="next-button"
                  type="button"
                  disabled={!canStep4Next}
                  onClick={() => setStep(5)}
                >
                  다음
                </button>
              </div>
            </>
          )}

          {step === 5 && (
            <>
              <div className="preview-header-wrap" inert={isEmailOpen}>
                <header className="preview-header" data-name="preview-header">
                  <button
                    className="preview-back"
                    type="button"
                    aria-label="뒤로 가기"
                    onClick={goBack}
                  >
                    <ChevronLeft size={22} strokeWidth={2.2} />
                  </button>
                  <div className="preview-title">
                    <span>REPITCH</span>
                    <span>제안서 검토</span>
                  </div>
                  <div className="preview-spacer" />
                </header>
              </div>

              <div className="preview-scroll" inert={isEmailOpen}>
                <div className="preview-document">
                  <section className="letterhead">
                    <p className="letter-label">받는 사람</p>
                    <div className="letter-brand">
                      <strong>{brandName.trim() || "-"}</strong>
                      <span>마케팅 담당자분께</span>
                    </div>
                    <div className="product-chip">
                      <Package aria-hidden="true" />
                      <span>{productName.trim() || "-"}</span>
                    </div>
                    <p className="written-date">작성일 · {writtenDate}</p>
                  </section>

                  <section className="preview-section">
                    <div className="preview-section-head">
                      <strong>01 · 제안자</strong>
                      <button type="button" onClick={() => setStep(2)}>
                        수정
                      </button>
                    </div>
                    <PreviewRow label="플랫폼">
                      {platform === "instagram" ? "Instagram" : "YouTube"}
                    </PreviewRow>
                    <PreviewRow label={platformCopy.nameLabel}>
                      {profileName.trim() || "-"}
                    </PreviewRow>
                    <PreviewRow label={platform === "instagram" ? "팔로워" : "구독자"}>
                      {formatNumber(profileCount)} 명
                    </PreviewRow>
                    <PreviewRow label="카테고리">
                      <div className="preview-pills">
                        {selectedCategories.map((category) => (
                          <span className="preview-pill" key={category}>
                            {category}
                          </span>
                        ))}
                      </div>
                    </PreviewRow>
                    {platform === "instagram" ? (
                      <>
                        <PreviewRow label="평균 좋아요 수">
                          {selectValues.averageLikes || "-"}
                        </PreviewRow>
                        {selectValues.averageSaves && (
                          <PreviewRow label="평균 저장 수">
                            {selectValues.averageSaves}
                          </PreviewRow>
                        )}
                        <PreviewRow label="평균 공유 수">
                          {selectValues.averageShares || "-"}
                        </PreviewRow>
                      </>
                    ) : (
                      <>
                        <PreviewRow label="평균 조회수">
                          {selectValues.averageViews || "-"}
                        </PreviewRow>
                        <PreviewRow label="최고 조회수">
                          {formatNumber(peakViews)}회
                        </PreviewRow>
                      </>
                    )}
                    <PreviewRow label="3개월 협업">
                      {selectValues.collabCount || "-"}
                    </PreviewRow>
                  </section>

                  <section className="preview-section">
                    <div className="preview-section-head">
                      <strong>02 · 나의 서사</strong>
                      <button type="button" onClick={() => setStep(3)}>
                        수정
                      </button>
                    </div>
                    <div className="preview-quote">
                      <p>{storyText.trim() || "-"}</p>
                    </div>
                  </section>

                  <section className="preview-section preview-section-compact">
                    <div className="preview-section-head">
                      <strong>03 · 콘텐츠 플랜</strong>
                      <button type="button" onClick={() => setStep(3)}>
                        수정
                      </button>
                    </div>
                    {selectedContentPlans.map((item, index) => (
                      <div key={item.label}>
                        <div className="plan-row">
                          <strong>{item.label}</strong>
                          <span className="plan-qty">x {item.count}</span>
                        </div>
                        {index < selectedContentPlans.length - 1 && (
                          <div className="preview-solid-separator" />
                        )}
                      </div>
                    ))}
                    <div className="preview-solid-separator" />
                    <PreviewRow label="콘텐츠 성격">{previewTone}</PreviewRow>
                    <PreviewRow label="1차 마감일">{uploadDate}</PreviewRow>
                  </section>

                  <section className="preview-section preview-section-compact">
                    <div className="preview-section-head">
                      <strong>04 · 제안 조건</strong>
                      <button type="button" onClick={() => setStep(4)}>
                        수정
                      </button>
                    </div>
                    <div className="price-preview">
                      <div className="price-preview-row">
                        <strong>{formatNumber(expectedPrice)}</strong>
                        <span>만 원</span>
                      </div>
                      <p>희망 단가</p>
                    </div>
                    <div className="preview-solid-separator" />
                    <div className="preview-row">
                      <span className="preview-row-label">2차 활용</span>
                      <span className="preview-row-value reuse-preview-value">
                        {reuseAllowed ? "동의" : "미동의"}
                      </span>
                    </div>
                  </section>
                </div>
              </div>

              <div className="preview-footer" inert={isEmailOpen}>
                <button
                  className="send-button"
                  type="button"
                  disabled={!canSubmitProposal}
                  onClick={openEmail}
                >
                  제안서 보내기
                </button>
                <button
                  className="restart-button"
                  type="button"
                  onClick={() => setStep(1)}
                >
                  처음부터 수정하기
                </button>
              </div>

              {isEmailOpen && (
                <div
                  className="email-panel"
                  role="presentation"
                  onClick={closeEmail}
                >
                  <div
                    className="email-modal"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="email-panel-title"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <h2 className="email-modal-title" id="email-panel-title">
                      제안 결과를 받을
                      <br />
                      이메일을 입력해주세요
                    </h2>
                    <p className="email-modal-desc">
                      브랜드가 제안서를 검토한 뒤, 이 이메일로 연락드릴게요.
                    </p>
                    <input
                      className="email-modal-input"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      autoFocus
                      placeholder="이메일 주소"
                      value={contactEmail}
                      onChange={(event) => {
                        setContactEmail(event.target.value);
                        if (emailError) {
                          setEmailError("");
                        }
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          confirmEmail();
                        }
                      }}
                    />
                    <label className="email-consent">
                      <input
                        className="email-consent-checkbox"
                        type="checkbox"
                        checked={privacyConsent}
                        onChange={(event) => {
                          setPrivacyConsent(event.target.checked);
                          if (emailError) {
                            setEmailError("");
                          }
                        }}
                      />
                      <span className="email-consent-text">
                        <span className="email-consent-policy">[개인정보 처리방침]</span>{" "}
                        개인정보 수집·이용에 동의합니다{" "}
                        <span className="email-consent-required">(필수)</span>
                      </span>
                    </label>
                    {emailError && (
                      <p className="email-modal-error">{emailError}</p>
                    )}
                  <div className="email-modal-actions">
                    <button
                      className="email-modal-cancel"
                      type="button"
                      onClick={closeEmail}
                    >
                      취소
                    </button>
                    <button
                      className="email-modal-submit"
                      type="button"
                      onClick={confirmEmail}
                      disabled={!privacyConsent || isSaving}
                    >
                      {isSaving ? "전송 중…" : "제안서 보내기"}
                    </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {step === 6 && (
            <div className="completion-content">
              <img
                className="completion-logo"
                src={completionLogoUrl}
                alt="repitch"
              />
              <p className="completion-tagline">
                브랜드와 크리에이터의
                <br />
                협업을 새롭게
              </p>
              <h1 className="completion-title">
                <span>제안서를</span>{" "}
                <span className="completion-blue">전송했어요!</span>
              </h1>
              <p className="completion-copy">
                해당 브랜드가 검토 후 응답하면
                <br />
                입력하신 이메일로 결과를 보내드릴게요
              </p>
              <button
                className="completion-close"
                type="button"
                onClick={onClose}
              >
                닫기
              </button>
            </div>
          )}
    </section>
  );
}


function InstagramIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="17.5" cy="6.5" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function YoutubeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2" y="5" width="20" height="14" rx="4" />
      <path d="M10 9l5 3-5 3z" fill="currentColor" stroke="none" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M5 5l14 14M19 5L5 19" />
    </svg>
  );
}

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

export function OnboardingModal({
  open,
  onClose,
  children,
  ariaLabel = "역제안서 작성",
}: {
  open: boolean;
  onClose: () => void;
  // Defaults to the influencer flow; pass children to reuse the shell for
  // another flow (e.g. the brand application). screenStyles is injected here,
  // so any child can use the same .onboarding-scope classes.
  children?: ReactNode;
  ariaLabel?: string;
}) {
  const [mounted, setMounted] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const restoreFocus = useRef<HTMLElement | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;

    restoreFocus.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const card = cardRef.current;
    const first = card?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? card)?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !card) return;

      const focusable = Array.from(
        card.querySelectorAll<HTMLElement>(FOCUSABLE),
      ).filter((el) => el.offsetParent !== null || el === document.activeElement);
      if (focusable.length === 0) {
        event.preventDefault();
        card.focus();
        return;
      }
      const firstEl = focusable[0];
      const lastEl = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (event.shiftKey && (active === firstEl || active === card)) {
        event.preventDefault();
        lastEl.focus();
      } else if (!event.shiftKey && active === lastEl) {
        event.preventDefault();
        firstEl.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      restoreFocus.current?.focus?.();
    };
  }, [open, onClose]);

  if (!mounted || !open) return null;

  return createPortal(
    <>
      <style dangerouslySetInnerHTML={{ __html: screenStyles }} />
      <div
        className="onboarding-overlay"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) onClose();
        }}
      >
        <div
          className="onboarding-card"
          ref={cardRef}
          role="dialog"
          aria-modal="true"
          aria-label={ariaLabel}
          tabIndex={-1}
        >
          <button
            className="onboarding-close"
            type="button"
            aria-label="닫기"
            onClick={onClose}
          >
            <CloseIcon />
          </button>
          <div className="onboarding-scope">
            {children ?? <OnboardingFlow onClose={onClose} />}
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}

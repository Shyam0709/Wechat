import { CometChatLocalize } from '@cometchat/chat-uikit-react';
import englishUS from '../locales/en-US/en-US.json';
import englishUK from '../locales/en-GB/en-GB.json';
import german from '../locales/de/de.json';
import spanish from '../locales/es/es.json';
import french from '../locales/fr/fr.json';
import hindi from '../locales/hi/hi.json';
import hungarian from '../locales/hu/hu.json';
import lithuanian from '../locales/lt/lt.json';
import malay from '../locales/ms/ms.json';
import portuguese from '../locales/pt/pt.json';
import russian from '../locales/ru/ru.json';
import swedish from '../locales/sv/sv.json';
import chinese from '../locales/zh/zh.json';
import chineseTaiwan from '../locales/zh-tw/zh-tw.json';

/**
 * Initializes the localization for both the sample app and the UI Kit.
 *
 * This function sets up the localization system by determining the language to be used.
 * It uses the provided `language` parameter if available; otherwise, it defaults to the browser's language settings.
 *
 * @param {string} [language] - The language code to be used for localization (e.g., 'en', 'fr', 'es'). If not provided, the browser's default language is used.
 *
 * @example
 * // Initialize localization with a specific language
 * setupLocalization('fr'); // Sets language to French
 *
 * @example
 * // Initialize localization using the browser's default language
 * setupLocalization(); // Defaults to the browser's language
 */
export function setupLocalization(language?: string) {
  const resourcesJson = {
    'en-US': englishUS,
    'en-UK': englishUK,
    'ru-RU': russian,
    'fr-FR': french,
    'de-DE': german,
    'zh-CN': chinese,
    'zh-TW': chineseTaiwan,
    'es-ES': spanish,
    'hi-IN': hindi,
    'ms-MY': malay,
    'pt-PT': portuguese,
    'sv-SE': swedish,
    'lt-LT': lithuanian,
    'hu-HU': hungarian,
  };
  CometChatLocalize.addTranslation(resourcesJson);
  CometChatLocalize.setCurrentLanguage(language ?? 'en-US');
}

/**
 * This function takes in two hexadecimal color codes and a percentage, then blends
 * the base color towards the blend color by the given percentage. The result is a
 * new hexadecimal color code.
 *
 * @param {string} color - The base color to blend, in hexadecimal format (e.g., '#FF5733').
 * @param {number} percentage - The percentage to blend the base color with the blend color.
 * @param {string} blendWith - The color to blend with, in hexadecimal format (e.g., '#FFFFFF' for white).
 * @returns {string} - The resulting blended color in hexadecimal format.
 */
function blendColorWith(color: string, percentage: number, blendWith: string): string {
  const baseR = parseInt(color.substring(1, 3), 16);
  const baseG = parseInt(color.substring(3, 5), 16);
  const baseB = parseInt(color.substring(5, 7), 16);

  const blendR = parseInt(blendWith.substring(1, 3), 16);
  const blendG = parseInt(blendWith.substring(3, 5), 16);
  const blendB = parseInt(blendWith.substring(5, 7), 16);

  const newR = Math.min(Math.max(0, Math.round(baseR + (blendR - baseR) * (percentage / 100))), 255)
    .toString(16)
    .padStart(2, '0');
  const newG = Math.min(Math.max(0, Math.round(baseG + (blendG - baseG) * (percentage / 100))), 255)
    .toString(16)
    .padStart(2, '0');
  const newB = Math.min(Math.max(0, Math.round(baseB + (blendB - baseB) * (percentage / 100))), 255)
    .toString(16)
    .padStart(2, '0');

  return `#${newR}${newG}${newB}`;
}

/**
 * Dynamically generates and sets extended primary colors based on the primary color.
 *
 * This function retrieves the primary color from CSS variables and generates a set
 * of extended primary colors by blending the primary color with white or black, depending
 * on the current theme (light or dark mode). The generated colors are then applied as
 * CSS variables.
 *
 * @static
 */
export function generateExtendedColors() {
  const isDarkMode = document.querySelector('[data-theme="dark"]') ? true : false;

  const root = document.querySelector('[class="cometchat-root"]') as HTMLElement;
  const primaryColor = getComputedStyle(root).getPropertyValue('--cometchat-primary-color').trim();

  if (primaryColor) {
    const lightModePercentages = [100, 88, 77, 66, 55, 44, 33, 22, 11, 11];
    const darkModePercentages = [80, 72, 64, 56, 48, 40, 32, 24, 16, 8];
    const percentages = isDarkMode ? darkModePercentages : lightModePercentages;
    const blendColor = isDarkMode ? '#000000' : '#FFFFFF';
    const lastBlendColor = !isDarkMode ? '#000000' : '#FFFFFF';
    let extendedVar: number;
    percentages.forEach((percentage, index) => {
      const lastIndex = index === percentages.length - 1 ? true : false;
      const color = lastIndex ? lastBlendColor : blendColor;
      if (index === 0) {
        extendedVar = 50;
      } else if (index === 1) {
        extendedVar = 100;
      } else {
        extendedVar += 100;
      }
      const adjustedColor = blendColorWith(primaryColor, percentage, color);
      root.style.setProperty(`--cometchat-extended-primary-color-${extendedVar}`, adjustedColor);
    });
  }
}

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                "primary": "#ffd400",
                "secondary": "#ff90e8",
                "accent-blue": "#23a6d5",
                "accent-green": "#00f090",
                "accent-purple": "#a29bfe",
                "accent-orange": "#fdcb6e",
                "background-light": "#fffdf5",
                "background-dark": "#1a1a1a",
                "text-main": "#000000",
            },
            fontFamily: {
                "display": ["Space Grotesk", "sans-serif"],
                "sans": ["Space Grotesk", "sans-serif"]
            },
            boxShadow: {
                "neo": "6px 6px 0px 0px #000000",
                "neo-sm": "3px 3px 0px 0px #000000",
                "neo-lg": "10px 10px 0px 0px #000000",
                "neo-hover": "2px 2px 0px 0px #000000",
                "neo-flat": "0px 0px 0px 0px #000000",
            },
            borderWidth: {
                "3": "3px",
                "4": "4px",
            }
        },
    },
    plugins: [],
}

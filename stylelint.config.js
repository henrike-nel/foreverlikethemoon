/** @type {import("stylelint").Config} */
export default {
  defaultSeverity: "error",
  rules: {
    "at-rule-no-unknown": null,
    "declaration-property-value-disallowed-list": [
      {
        color: ["/accent-decorative/"],
        fill: ["/accent-decorative/"],
        stroke: ["/accent-decorative/"],
        outline: ["/accent-decorative/"],
        "caret-color": ["/accent-decorative/"],
        "outline-color": ["/accent-decorative/"],
        "text-decoration-color": ["/accent-decorative/"],
        "-webkit-text-stroke-color": ["/accent-decorative/"],
      },
      {
        message:
          "Gilt decorative cannot carry text, fill, or focus. Use --color-accent.",
      },
    ],
  },
};

/** @type {import("eslint").ESLint.Plugin} */
const plugin = {
  rules: {
    "no-accent-decorative-on-text": {
      meta: {
        type: "problem",
        docs: {
          description:
            "Gilt decorative must not carry text, fill, or focus rings.",
        },
      },
      create(context) {
        const forbidden =
          /\b(?:text|placeholder|caret|decoration|from|to|via|ring|outline|fill|stroke)-accent-decorative\b/;

        const check = (node, value) => {
          if (typeof value === "string" && forbidden.test(value)) {
            context.report({
              node,
              message:
                "Use --color-accent for anything readable or focused. --color-accent-decorative is ornament only.",
            });
          }
        };

        return {
          Literal(node) {
            check(node, node.value);
          },
          TemplateElement(node) {
            check(node, node.value.cooked ?? "");
          },
        };
      },
    },
    "no-arbitrary-tailwind": {
      meta: {
        type: "problem",
        docs: {
          description: "No arbitrary Tailwind values; add a token instead.",
        },
      },
      create(context) {
        const arbitrary = /(?:^|[\s"'])[a-z0-9:,/-]+-\[[^\]]+\]/;

        const check = (node, value) => {
          if (typeof value === "string" && arbitrary.test(value)) {
            context.report({
              node,
              message:
                "Arbitrary Tailwind values are banned. If you need a value, it becomes a token.",
            });
          }
        };

        return {
          Literal(node) {
            check(node, node.value);
          },
          TemplateElement(node) {
            check(node, node.value.cooked ?? "");
          },
        };
      },
    },
  },
};

export default plugin;

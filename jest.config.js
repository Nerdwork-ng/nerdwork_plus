"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config = {
    preset: "ts-jest",
    testEnvironment: "node", // Use "jsdom" for React component tests
    moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
    // REMOVE the transform block below! ts-jest will handle it.
    // transform: {
    //   "^.+\\.(ts|tsx|js|jsx)$": "babel-jest",
    // },
    testMatch: [
        "**/__tests__/**/*.[jt]s?(x)",
        "**/?(*.)+(spec|test).[tj]s?(x)"
    ],
    moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/$1",
    },
};
exports.default = config;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiamVzdC5jb25maWcuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJqZXN0LmNvbmZpZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUVBLE1BQU0sTUFBTSxHQUFXO0lBQ3JCLE1BQU0sRUFBRSxTQUFTO0lBQ2pCLGVBQWUsRUFBRSxNQUFNLEVBQUUsd0NBQXdDO0lBQ2pFLG9CQUFvQixFQUFFLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLE1BQU0sQ0FBQztJQUN4RCw0REFBNEQ7SUFDNUQsZUFBZTtJQUNmLDRDQUE0QztJQUM1QyxLQUFLO0lBQ0wsU0FBUyxFQUFFO1FBQ1QsNkJBQTZCO1FBQzdCLGdDQUFnQztLQUNqQztJQUNELGdCQUFnQixFQUFFO1FBQ2hCLFVBQVUsRUFBRSxjQUFjO0tBQzNCO0NBQ0YsQ0FBQztBQUNGLGtCQUFlLE1BQU0sQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIHsgQ29uZmlnIH0gZnJvbSBcImplc3RcIjtcclxuXHJcbmNvbnN0IGNvbmZpZzogQ29uZmlnID0ge1xyXG4gIHByZXNldDogXCJ0cy1qZXN0XCIsXHJcbiAgdGVzdEVudmlyb25tZW50OiBcIm5vZGVcIiwgLy8gVXNlIFwianNkb21cIiBmb3IgUmVhY3QgY29tcG9uZW50IHRlc3RzXHJcbiAgbW9kdWxlRmlsZUV4dGVuc2lvbnM6IFtcInRzXCIsIFwidHN4XCIsIFwianNcIiwgXCJqc3hcIiwgXCJqc29uXCJdLFxyXG4gIC8vIFJFTU9WRSB0aGUgdHJhbnNmb3JtIGJsb2NrIGJlbG93ISB0cy1qZXN0IHdpbGwgaGFuZGxlIGl0LlxyXG4gIC8vIHRyYW5zZm9ybToge1xyXG4gIC8vICAgXCJeLitcXFxcLih0c3x0c3h8anN8anN4KSRcIjogXCJiYWJlbC1qZXN0XCIsXHJcbiAgLy8gfSxcclxuICB0ZXN0TWF0Y2g6IFtcclxuICAgIFwiKiovX190ZXN0c19fLyoqLyouW2p0XXM/KHgpXCIsXHJcbiAgICBcIioqLz8oKi4pKyhzcGVjfHRlc3QpLlt0al1zPyh4KVwiXHJcbiAgXSxcclxuICBtb2R1bGVOYW1lTWFwcGVyOiB7XHJcbiAgICBcIl5ALyguKikkXCI6IFwiPHJvb3REaXI+LyQxXCIsXHJcbiAgfSxcclxufTtcclxuZXhwb3J0IGRlZmF1bHQgY29uZmlnOyJdfQ==
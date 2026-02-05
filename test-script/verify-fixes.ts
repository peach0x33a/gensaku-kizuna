
import { escapeHtml, cleanId } from "../packages/bot-service/src/utils";
import { strict as assert } from "assert";

console.log("Running verification tests...");

// 1. Test escapeHtml
console.log("Testing escapeHtml...");
assert.equal(escapeHtml("Hello"), "Hello");
assert.equal(escapeHtml("<b>Bold</b>"), "&lt;b&gt;Bold&lt;/b&gt;");
assert.equal(escapeHtml("Me & You"), "Me &amp; You");
assert.equal(escapeHtml('"Quote"'), "&quot;Quote&quot;");
assert.equal(escapeHtml("'Single'"), "&#039;Single&#039;");
console.log("✅ escapeHtml passed");

// 2. Test cleanId
console.log("Testing cleanId...");
assert.equal(cleanId("12345"), "12345");
assert.equal(cleanId("abc123xyz"), "123");
assert.equal(cleanId(123456), "123456");
console.log("✅ cleanId passed");

// 3. Simulate List Command String Construction
console.log("Testing List Command String Construction...");
const mockData = {
    name: "Artist <script> & Name",
    id: "12345",
    lastPid: "98765",
    updatedAt: "2024-01-01 12:00:00"
};

// Simplified FTL template simulation
const template = `👤 <b><a href="tg://msg?text=/artist%20${mockData.id}">${escapeHtml(mockData.name)}</a></b> (<a href="tg://msg?text=/artist%20${mockData.id}">${mockData.id}</a>)
🆕 最后作品：<a href="tg://msg?text=/illust%20${mockData.lastPid}">${mockData.lastPid}</a>
🕒 更新时间：${mockData.updatedAt}`;

console.log("Generated String:\n" + template);

assert.ok(template.includes("&lt;script&gt; &amp; Name"), "Name should be escaped");
assert.ok(template.includes("tg://msg?text=/artist%2012345"), "Artist link should be correct");
assert.ok(template.includes("tg://msg?text=/illust%2098765"), "Illust link should be correct");
console.log("✅ List Command Logic passed");

console.log("All verifications passed!");

"""Make the Claude Artifact version of index.html: the same page without the <!doctype>/<head>/<body> shell.
The Artifact adds its own shell, so we keep only what sits between the artifact:* markers.
Usage: python3 tools/build_artifact.py index.html OUT.html
"""
import sys
src, out = sys.argv[1], sys.argv[2]
s = open(src, encoding="utf-8").read()
head = s[s.index("<!-- artifact:start -->") + len("<!-- artifact:start -->"): s.index("<!-- artifact:head-end -->")]
body = s[s.index("<body>") + len("<body>"): s.index("<!-- artifact:end -->")]
open(out, "w", encoding="utf-8").write(head.strip() + "\n" + body.strip() + "\n")
print("wrote", out)

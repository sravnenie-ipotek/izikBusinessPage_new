# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - alert [ref=e2]
  - generic [ref=e4]:
    - generic [ref=e5]:
      - generic [ref=e6]:
        - img [ref=e8]
        - generic [ref=e11]:
          - button "EN" [ref=e12] [cursor=pointer]:
            - img
            - text: EN
          - button "עב" [ref=e13] [cursor=pointer]:
            - img
            - text: עב
      - heading "Admin Login" [level=3] [ref=e14]
      - paragraph [ref=e15]: Enter your password to access the admin panel
    - generic [ref=e17]:
      - generic [ref=e18]:
        - generic [ref=e19]: Password
        - textbox "Password" [ref=e20]
      - button "Login" [ref=e21] [cursor=pointer]
```
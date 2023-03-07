from .main import main

try:
    main()
except Exception:
    print('Test failed!')
    raise

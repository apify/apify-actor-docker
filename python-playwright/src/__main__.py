import asyncio

from .main import main

try:
    asyncio.run(main())
except Exception:
    print('Test failed!')
    raise

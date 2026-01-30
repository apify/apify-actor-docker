import os


def main():
    print("=" * 60)
    print("WARNING: If you see this message, it means you did not")
    print("set up your Docker image correctly. Please replace this")
    print("file with your actual application code.")
    print("=" * 60)
    print()
    print("Environment variables set in this image:")
    print("-" * 60)
    for key, value in sorted(os.environ.items()):
        if key.startswith(("PYTHON", "PIP", "PATH", "APIFY", "CRAWLEE")):
            print(f"  {key}={value}")
    print("-" * 60)

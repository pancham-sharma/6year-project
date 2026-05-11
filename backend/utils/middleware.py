import traceback
import logging

logger = logging.getLogger(__name__)

class Log500Middleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        return response

    def process_exception(self, request, exception):
        # This will be called only when a view raises an exception
        print("\n" + "="*80)
        print(f"❌ 500 ERROR: {request.path}")
        print(f"Exception Type: {type(exception).__name__}")
        print(f"Exception Message: {str(exception)}")
        print("-" * 40)
        traceback.print_exc()
        print("="*80 + "\n")
        return None  # Let Django continue with its default error handling

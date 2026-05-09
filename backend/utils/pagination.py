from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response

class CustomPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'limit'
    max_page_size = 100

    def get_paginated_response(self, data):
        return Response({
            'data': data,
            'meta': {
                'total': self.page.paginator.count,
                'page': self.page.number,
                'totalPages': self.page.paginator.num_pages,
                'hasNext': self.get_next_link() is not None,
                'hasPrev': self.get_previous_link() is not None,
                'limit': self.get_page_size(self.request)
            }
        })

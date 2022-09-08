import { IQuery, QueryHandler, QUERY_HANDLER_METADATA, QUERY_METADATA } from '../../../lib';

describe('@QueryHandler', () => {
	class TestQuery implements IQuery {}

	@QueryHandler(TestQuery)
	class TestQueryHandler {}

	it('should specify which query the query-handler handles', () => {
		const query: IQuery = Reflect.getMetadata(QUERY_HANDLER_METADATA, TestQueryHandler);
		expect(query).toEqual(TestQuery);

		const queryMetadata = Reflect.getMetadata(QUERY_METADATA, query);
		expect(queryMetadata.id).toBeDefined();
	});
});
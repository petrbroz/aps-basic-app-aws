# Get user input for stack name
$stack_name = Read-Host "Enter the name of the CloudFormation stack:"

# Get the API Gateway URL from the stack
$api_gateway_endpoint = aws cloudformation describe-stacks --stack-name $stack_name --query "Stacks[0].Outputs[?OutputKey=='APIGatewayEndpoint'].OutputValue" --output text

# Get the CloudFront Distribution ID from the stack
$cloudfront_distribution_id = aws cloudformation describe-stacks --stack-name $stack_name --query "Stacks[0].Outputs[?OutputKey=='CloudFrontDistributionId'].OutputValue" --output text

# Get the S3 Bucket Name from the stack
$s3_bucket_name = aws cloudformation describe-stacks --stack-name $stack_name --query "Stacks[0].Outputs[?OutputKey=='WebS3BucketName'].OutputValue" --output text

# Output the results
Write-Host "API Gateway URL: $api_gateway_endpoint"
Write-Host "CloudFront Distribution ID: $cloudfront_distribution_id"
Write-Host "S3 Bucket Name: $s3_bucket_name"

# Move to frontend folder
cd frontend/

# Add the API Gateway endpoint to the config file
"{ \"API_ENDPOINT\": \"$api_gateway_endpoint\" }" | Out-File "config.json"

# Confirm that the endpoint has been added to the config file
Write-Host "The API Gateway endpoint has been added to the config file:"
Get-Content "config.json"

# Build frontend code
Write-Host "Building frontend code"
yarn run build

# Sync distribution with S3
Write-Host "Syncing assets"
cd dist/
aws s3 sync . "s3://$s3_bucket_name/"

# Create cloudfront invalidation and capture id for next step
Write-Host "Invalidating CloudFront distribution"
$invalidation_output = aws cloudfront create-invalidation --distribution-id $cloudfront_distribution_id --paths "/*"
$invalidation_id = $invalidation_output | Select-String -Pattern '(?<=Id": ")[^"]+' | ForEach-Object { $_.Matches.Value }

# Wait for cloudfront invalidation to complete
Write-Host "Waiting for CloudFront invalidation to complete"
aws cloudfront wait invalidation-completed --distribution-id $cloudfront_distribution_id --id $invalidation_id

# Get cloudfront domain name and validate
$cloudfront_domain_name = aws cloudfront list-distributions --query "DistributionList.Items[?Id=='$cloudfront_distribution_id'].DomainName" --output text
Write-Host "The invalidation is now complete - please visit your cloudfront URL to test: $cloudfront_domain_name"
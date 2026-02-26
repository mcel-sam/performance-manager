# Terraform

Infrastructure as Code for Azure resources lives here.

## Planned structure

- `modules/` reusable Terraform modules
- `env/dev/` development environment composition

## Basic workflow

```bash
cd infra/terraform
terraform init
terraform plan
terraform apply
```

Use remote state for shared environments. Do not commit Terraform state files.

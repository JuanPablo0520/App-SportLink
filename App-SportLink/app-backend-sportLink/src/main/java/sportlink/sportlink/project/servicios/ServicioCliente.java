package sportlink.sportlink.project.servicios;

import sportlink.sportlink.project.entidades.Cliente;
import sportlink.sportlink.project.dto.ClienteDto;
import sportlink.sportlink.project.repositorios.RepositorioCliente;
import org.modelmapper.ModelMapper;
import org.modelmapper.TypeToken;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ServicioCliente {

    private final ModelMapper modelMapper = new ModelMapper();
    private final RepositorioCliente repositorioCliente;

    public ServicioCliente(RepositorioCliente repositorioCliente){
        this.repositorioCliente = repositorioCliente;
    }

    public List<ClienteDto> obtenerTodos(){

        TypeToken<List<ClienteDto>> typeToken = new TypeToken<>(){};
        return modelMapper.map(repositorioCliente.obtenerTodos(), typeToken.getType());
    }

    public Optional<ClienteDto> obtenerPorPk(int pkCliente){
        return Optional.ofNullable(modelMapper.map(repositorioCliente.obtenerPorPk(pkCliente).orElse(null), ClienteDto.class));
    }

    public ClienteDto crear(ClienteDto clienteDto){
        if(clienteDto.getIdCliente() == null){
            Cliente cliente = repositorioCliente.crear(modelMapper.map(clienteDto, Cliente.class));
            return modelMapper.map(cliente, ClienteDto.class);
        }else{
            Optional<ClienteDto> temporal = obtenerPorPk(clienteDto.getIdCliente());
            if(temporal.isPresent()){
                return clienteDto;
            }else{
                Cliente cliente = repositorioCliente.crear(modelMapper.map(clienteDto, Cliente.class));
                return modelMapper.map(cliente, ClienteDto.class);
            }
        }
    }

    public ClienteDto actualizar(ClienteDto clienteDto){
        if(clienteDto.getIdCliente() != null){

            Optional<ClienteDto> nuevoCliente = obtenerPorPk(clienteDto.getIdCliente());

            if(nuevoCliente.isPresent()) {

                if (clienteDto.getNombre() != null) {
                    nuevoCliente.get().setNombre(clienteDto.getNombre());
                }

                if (clienteDto.getCorreo() != null) {
                    nuevoCliente.get().setCorreo(clienteDto.getCorreo());
                }

                if (clienteDto.getContrasenia() != null) {
                    nuevoCliente.get().setContrasenia(clienteDto.getContrasenia());
                }

                if (clienteDto.getFotoPerfil() != null) {
                    nuevoCliente.get().setFotoPerfil(clienteDto.getFotoPerfil());
                }

                if (clienteDto.getFechaNacimiento() != null) {
                    nuevoCliente.get().setFechaNacimiento(clienteDto.getFechaNacimiento());
                }

                if (clienteDto.getEstatura() != null) {
                    nuevoCliente.get().setEstatura(clienteDto.getEstatura());
                }

                if (clienteDto.getPeso() != null) {
                    nuevoCliente.get().setPeso(clienteDto.getPeso());
                }

                if (clienteDto.getTelefono() != null) {
                    nuevoCliente.get().setTelefono(clienteDto.getTelefono());
                }

                if (clienteDto.getUbicacion() != null) {
                    nuevoCliente.get().setUbicacion(clienteDto.getUbicacion());
                }

                Cliente cliente = repositorioCliente.actualizar(modelMapper.map(nuevoCliente, Cliente.class));

                return modelMapper.map(cliente, ClienteDto.class);
            }
        }

        return clienteDto;
    }

    public boolean eliminarTodos(){
        try {
            repositorioCliente.eliminarTodos();
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public boolean eliminar(int pkCliente){
        return obtenerPorPk(pkCliente).map(clienteDto -> {
            repositorioCliente.eliminar(modelMapper.map(clienteDto, Cliente.class));
            return true;
        }).orElse(false);
    }
}


package sportlink.sportlink.project.servicios;

import sportlink.sportlink.project.dto.ServicioDto;
import sportlink.sportlink.project.entidades.Servicio;
import sportlink.sportlink.project.repositorios.RepositorioServicio;
import org.modelmapper.ModelMapper;
import org.modelmapper.TypeToken;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ServicioServicio {
    private final ModelMapper modelMapper = new ModelMapper();
    private final RepositorioServicio repositorioServicio;

    public ServicioServicio(RepositorioServicio repositorioServicio){
        this.repositorioServicio = repositorioServicio;
    }

    public List<ServicioDto> obtenerTodos(){
        TypeToken<List<ServicioDto>> typeToken = new TypeToken<>(){};
        return modelMapper.map(repositorioServicio.obtenerTodos(), typeToken.getType());
    }

    public Optional<ServicioDto> obtenerPorPk(int pkServicio){
        return Optional.ofNullable(modelMapper.map(
                repositorioServicio.obtenerPorPk(pkServicio).orElse(null),
                ServicioDto.class
        ));
    }

    public ServicioDto crear(ServicioDto servicioDto){
        if(servicioDto.getIdServicio() == null){
            Servicio servicio = repositorioServicio.crear(modelMapper.map(servicioDto, Servicio.class));
            return modelMapper.map(servicio, ServicioDto.class);
        }else{
            Optional<ServicioDto> temporal = obtenerPorPk(servicioDto.getIdServicio());
            if(temporal.isPresent()){
                return servicioDto;
            }else{
                Servicio servicio = repositorioServicio.crear(modelMapper.map(servicioDto, Servicio.class));
                return modelMapper.map(servicio, ServicioDto.class);
            }
        }
    }

    public ServicioDto actualizar(ServicioDto servicioDto){
        if(servicioDto.getIdServicio() != null){
            Optional<ServicioDto> nuevoServicio = obtenerPorPk(servicioDto.getIdServicio());

            if(nuevoServicio.isPresent()){
                if (servicioDto.getNombre() != null) nuevoServicio.get().setNombre(servicioDto.getNombre());
                if (servicioDto.getDescripcion() != null) nuevoServicio.get().setDescripcion(servicioDto.getDescripcion());
                if (servicioDto.getPrecio() != null) nuevoServicio.get().setPrecio(servicioDto.getPrecio());
                if (servicioDto.getUbicacion() != null) nuevoServicio.get().setUbicacion(servicioDto.getUbicacion());

                Servicio servicio = repositorioServicio.actualizar(modelMapper.map(nuevoServicio.get(), Servicio.class));
                return modelMapper.map(servicio, ServicioDto.class);
            }
        }
        return servicioDto;
    }

    public boolean eliminarTodos(){
        try {
            repositorioServicio.eliminarTodos();
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public boolean eliminar(int pkServicio){
        return obtenerPorPk(pkServicio).map(servicioDto -> {
            repositorioServicio.eliminar(modelMapper.map(servicioDto, Servicio.class));
            return true;
        }).orElse(false);
    }
}

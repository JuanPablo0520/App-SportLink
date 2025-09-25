package sportlink.sportlink.project.servicios;

import sportlink.sportlink.project.dto.SesionDto;
import sportlink.sportlink.project.entidades.Sesion;
import sportlink.sportlink.project.repositorios.RepositorioSesion;
import org.modelmapper.ModelMapper;
import org.modelmapper.TypeToken;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ServicioSesion {
    private final ModelMapper modelMapper = new ModelMapper();
    private final RepositorioSesion repositorioSesion;

    public ServicioSesion(RepositorioSesion repositorioSesion){
        this.repositorioSesion = repositorioSesion;
    }

    public List<SesionDto> obtenerTodos(){
        TypeToken<List<SesionDto>> typeToken = new TypeToken<>(){};
        return modelMapper.map(repositorioSesion.obtenerTodos(), typeToken.getType());
    }

    public Optional<SesionDto> obtenerPorPk(int pkSesion){
        return Optional.ofNullable(modelMapper.map(
                repositorioSesion.obtenerPorPk(pkSesion).orElse(null),
                SesionDto.class
        ));
    }

    public SesionDto crear(SesionDto sesionDto){
        if(sesionDto.getIdSesion() == null){
            Sesion sesion = repositorioSesion.crear(modelMapper.map(sesionDto, Sesion.class));
            return modelMapper.map(sesion, SesionDto.class);
        }else{
            Optional<SesionDto> temporal = obtenerPorPk(sesionDto.getIdSesion());
            if(temporal.isPresent()){
                return sesionDto;
            }else{
                Sesion sesion = repositorioSesion.crear(modelMapper.map(sesionDto, Sesion.class));
                return modelMapper.map(sesion, SesionDto.class);
            }
        }
    }

    public SesionDto actualizar(SesionDto sesionDto){
        if(sesionDto.getIdSesion() != null){
            Optional<SesionDto> nuevaSesion = obtenerPorPk(sesionDto.getIdSesion());

            if(nuevaSesion.isPresent()){
                if (sesionDto.getFechaHora() != null) nuevaSesion.get().setFechaHora(sesionDto.getFechaHora());
                if (sesionDto.getEstado() != null) nuevaSesion.get().setEstado(sesionDto.getEstado());

                Sesion sesion = repositorioSesion.actualizar(modelMapper.map(nuevaSesion.get(), Sesion.class));
                return modelMapper.map(sesion, SesionDto.class);
            }
        }
        return sesionDto;
    }

    public boolean eliminarTodos(){
        try {
            repositorioSesion.eliminarTodos();
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public boolean eliminar(int pkSesion){
        return obtenerPorPk(pkSesion).map(sesionDto -> {
            repositorioSesion.eliminar(modelMapper.map(sesionDto, Sesion.class));
            return true;
        }).orElse(false);
    }
}

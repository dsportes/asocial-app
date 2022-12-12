<template>
  <q-card>
    <div v-for="reseau in reseaux" :key="reseau">
      <div class="row justify-center items-center cursor-pointer q-ma-lg"
        @click="stores.session.setReseau(reseau)">
        <img class="logo" :src="icons[reseau]"/>
        <span class="q-ml-lg fs-lg font-cf">{{reseau}}</span>
      </div>
    </div>
  </q-card>
</template>

<script>
import stores from "../stores/stores.mjs"

export default ({
  name: 'ChoixReseau',

  setup () {
    const configStore = stores.config
    return {
      reseaux: configStore.reseaux,
      icons: configStore.icons,
      stores
    }
  }
})
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.logo
  width: 2rem
</style>
